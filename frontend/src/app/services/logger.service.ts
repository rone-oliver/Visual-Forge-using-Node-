import { Injectable, isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {

  public info(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.info(`[INFO] ${new Date().toISOString()}: ${message}`, ...optionalParams);
    }
  }

  public debug(message: string, ...optionalParams: unknown[]): void {
    if (isDevMode()) {
      console.debug(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...optionalParams);
    }
  }

  public warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...optionalParams);
  }

  public error(message: string, ...optionalParams: unknown[]): void {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...optionalParams);
  }
}
