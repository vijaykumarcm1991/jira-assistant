import fs from 'fs';
import path from 'path';
import { app, shell } from 'electron';
import { LogEntry } from '../types/jira';

class Logger {
  private logFilePath: string = '';
  private memoryLogs: LogEntry[] = [];
  private maxMemoryLogs: number = 300;

  public init() {
    try {
      const userData = app.getPath('userData');
      this.logFilePath = path.join(userData, 'jira-assistant.log');
      
      // Add start entry
      this.info('Logger initialized', { logFilePath: this.logFilePath });
    } catch (err) {
      console.error('Failed to init logger:', err);
    }
  }

  private write(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, details?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    };

    this.memoryLogs.push(entry);
    if (this.memoryLogs.length > this.maxMemoryLogs) {
      this.memoryLogs.shift();
    }

    const detailStr = details ? ` | ${typeof details === 'string' ? details : JSON.stringify(details)}` : '';
    const line = `[${entry.timestamp}] [${level}] ${message}${detailStr}\n`;

    console.log(line.trim());

    if (this.logFilePath) {
      try {
        fs.appendFileSync(this.logFilePath, line, 'utf8');
      } catch {
        // ignore disk write failure
      }
    }
  }

  public info(message: string, details?: any) {
    this.write('INFO', message, details);
  }

  public warn(message: string, details?: any) {
    this.write('WARN', message, details);
  }

  public error(message: string, details?: any) {
    this.write('ERROR', message, details);
  }

  public debug(message: string, details?: any) {
    this.write('DEBUG', message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.memoryLogs];
  }

  public clearLogs(): boolean {
    this.memoryLogs = [];
    if (this.logFilePath && fs.existsSync(this.logFilePath)) {
      try {
        fs.writeFileSync(this.logFilePath, '', 'utf8');
      } catch {
        // ignore
      }
    }
    this.info('Logs cleared.');
    return true;
  }

  public openLogsFile() {
    if (this.logFilePath && fs.existsSync(this.logFilePath)) {
      shell.openPath(this.logFilePath);
    }
  }

  public openLogsFolder() {
    if (this.logFilePath) {
      shell.showItemInFolder(this.logFilePath);
    } else {
      shell.openPath(app.getPath('userData'));
    }
  }
}

export const logger = new Logger();
