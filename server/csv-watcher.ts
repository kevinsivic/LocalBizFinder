import { watch } from 'chokidar';
import fs from 'fs';
import path from 'path';
import csvParser from 'csv-parser';
import { db } from './db';
import { businesses, insertBusinessSchema } from '@shared/schema';
import { log } from './vite';
import { geocodeAddressWithRetry, geocodeAddressWithFallback } from './geocoding-server';

// Directory to watch for CSV files
const CSV_DIRECTORY = path.resolve('./data/csv');
// Time to wait before processing a file (to ensure it's fully written)
const DEBOUNCE_TIME = 1000; // 1 second

// State to keep track of files being processed to avoid duplicate processing
const processingFiles = new Set<string>();
// Keep track of processed files to avoid reprocessing
const processedFiles = new Set<string>();

// Create the directory if it doesn't exist
if (!fs.existsSync(CSV_DIRECTORY)) {
  fs.mkdirSync(CSV_DIRECTORY, { recursive: true });
  log(`Created CSV directory at ${CSV_DIRECTORY}`, 'csv-watcher');
}

export function startCsvWatcher() {
  log('Starting CSV watcher...', 'csv-watcher');

  // Initialize the watcher to only watch the root directory, not subdirectories 
  const watcher = watch(CSV_DIRECTORY, {
    ignored: [
      /(^|[\/\\])\..*/, // ignore dotfiles
      "**/processed/**", // ignore processed directory
      "**/error/**" // ignore error directory
    ],
    persistent: true,
    depth: 0, // only watch files in the root directory, not subdirectories
    awaitWriteFinish: {
      stabilityThreshold: DEBOUNCE_TIME,
      pollInterval: 100
    }
  });

  // Handle new or changed files
  watcher.on('add', async (filePath) => {
    if (path.extname(filePath).toLowerCase() !== '.csv') {
      return;
    }

    // Check if file is already being processed or has been processed
    if (processingFiles.has(filePath) || processedFiles.has(filePath)) {
      return;
    }

    processingFiles.add(filePath);
    log(`New CSV file detected: ${filePath}`, 'csv-watcher');

    try {
      await processCSVFile(filePath);
      // Mark as processed
      processedFiles.add(filePath);
      // Move the file to prevent reprocessing
      const processedDir = path.join(CSV_DIRECTORY, 'processed');
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }
      const timestamp = Date.now();
      const newFilePath = path.join(
        processedDir, 
        `processed_${timestamp}.csv`
      );
      fs.renameSync(filePath, newFilePath);
      log(`Moved processed file to ${newFilePath}`, 'csv-watcher');
    } catch (error) {
      log(`Error processing CSV file ${filePath}: ${error}`, 'csv-watcher');
      // Move to error folder
      const errorDir = path.join(CSV_DIRECTORY, 'error');
      if (!fs.existsSync(errorDir)) {
        fs.mkdirSync(errorDir, { recursive: true });
      }
      const timestamp = Date.now();
      const newFilePath = path.join(
        errorDir, 
        `error_${timestamp}.csv`
      );
      fs.renameSync(filePath, newFilePath);
      log(`Moved file with errors to ${newFilePath}`, 'csv-watcher');
    } finally {
      processingFiles.delete(filePath);
    }
  });

  // Handle errors
  watcher.on('error', (error) => {
    log(`CSV watcher error: ${error}`, 'csv-watcher');
  });

  log(`Watching for CSV files in ${CSV_DIRECTORY}`, 'csv-watcher');
  return watcher;
}

// Process a CSV file and insert its contents into the database
async function processCSVFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const errors: string[] = [];

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => {
        results.push(data);
      })
      .on('error', (error) => {
        reject(`Error parsing CSV: ${error.message}`);
      })
      .on('end', async () => {
        log(`Parsed ${results.length} records from ${filePath}`, 'csv-watcher');
        
        if (results.length === 0) {
          resolve();
          return;
        }

        // Validate and insert businesses
        try {
          for (let index = 0; index < results.length; index++) {
            try {
              const row = results[index];
              // Check for missing coordinates and use geocoding if necessary
              let latitude = null;
              let longitude = null;
              
              // Try to use provided coordinates first
              if (row.latitude && row.longitude && !isNaN(parseFloat(row.latitude)) && !isNaN(parseFloat(row.longitude))) {
                latitude = parseFloat(row.latitude);
                longitude = parseFloat(row.longitude);
                log(`Using provided coordinates for ${row.name}: ${latitude}, ${longitude}`, 'csv-watcher');
              } 
              // Use geocoding to get coordinates from address
              else if (row.address) {
                log(`Geocoding address for ${row.name}: ${row.address}`, 'csv-watcher');
                try {
                  // Try with retry first
                  let coordinates = await geocodeAddressWithRetry(row.address, 3, 1000);
                  
                  // If retry fails, use the fallback method which will never return null
                  if (!coordinates) {
                    log(`Using fallback geocoding for ${row.name}`, 'csv-watcher');
                    coordinates = await geocodeAddressWithFallback(row.address);
                    log(`Using fallback coordinates for ${row.name}: ${coordinates.lat}, ${coordinates.lon}`, 'csv-watcher');
                  } else {
                    log(`Successfully geocoded address for ${row.name}: ${coordinates.lat}, ${coordinates.lon}`, 'csv-watcher');
                  }
                  
                  latitude = coordinates.lat;
                  longitude = coordinates.lon;
                } catch (error) {
                  // This should never happen with the fallback, but just in case
                  log(`Critical geocoding error for ${row.name}: ${error}`, 'csv-watcher');
                  // Use Portland, OR as default coordinates in case of critical error
                  latitude = 45.5202;
                  longitude = -122.6742;
                  log(`Using emergency fallback coordinates for ${row.name}`, 'csv-watcher');
                }
              } else {
                log(`Missing both coordinates and address for ${row.name}`, 'csv-watcher');
                // Use Portland, OR as default coordinates when both are missing
                latitude = 45.5202;
                longitude = -122.6742;
                log(`Using default coordinates for ${row.name} due to missing data`, 'csv-watcher');
              }
              
              // Convert string values to correct types
              const businessData = {
                name: row.name,
                description: row.description,
                category: row.category,
                address: row.address,
                phone: row.phone || null,
                website: row.website || null,
                latitude: latitude,
                longitude: longitude,
                imageUrl: row.imageUrl || null,
                // Using a default admin user ID (adjust as necessary)
                createdBy: 1
              };

              // Validate the data
              const validBusinessData = insertBusinessSchema.parse(businessData);
              
              // Check if business already exists (by name and address to avoid duplicates)
              const existingBusiness = await db.query.businesses.findFirst({
                where: (businesses, { and, eq }) => and(
                  eq(businesses.name, validBusinessData.name),
                  eq(businesses.address, validBusinessData.address)
                )
              });

              if (existingBusiness) {
                log(`Business already exists: ${validBusinessData.name} at ${validBusinessData.address}`, 'csv-watcher');
                continue;
              }

              // Insert the business
              await db.insert(businesses).values(validBusinessData);
              log(`Inserted business: ${validBusinessData.name}`, 'csv-watcher');
            } catch (error) {
              const errorMsg = `Error processing row ${index + 1}: ${error}`;
              errors.push(errorMsg);
              log(errorMsg, 'csv-watcher');
            }
          }

          if (errors.length > 0) {
            log(`Completed with ${errors.length} errors and ${results.length - errors.length} successful insertions`, 'csv-watcher');
            // If we have some errors but also some successes, we consider it a partial success
            if (errors.length < results.length) {
              resolve();
            } else {
              reject(`Failed to process any records: ${errors.join('; ')}`);
            }
          } else {
            log(`Successfully processed all ${results.length} records`, 'csv-watcher');
            resolve();
          }
        } catch (error) {
          reject(`Error inserting data: ${error}`);
        }
      });
  });
}