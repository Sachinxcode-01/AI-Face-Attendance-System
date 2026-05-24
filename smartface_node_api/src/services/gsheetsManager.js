const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GSheetsManager {
  constructor(credentialsPath = path.join(__dirname, '../../credentials.json')) {
    this.credentialsPath = credentialsPath;
    this.scope = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly'
    ];
    this.auth = null;
    this.sheets = null;
  }

  authenticate() {
    if (fs.existsSync(this.credentialsPath)) {
      this.auth = new google.auth.GoogleAuth({
        keyFile: this.credentialsPath,
        scopes: this.scope,
      });
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      return true;
    }
    return false;
  }

  getSpreadsheetId(sheetUrl) {
    const matches = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (matches && matches[1]) {
      return matches[1];
    }
    throw new Error("Invalid Google Sheets URL format");
  }

  async addRecord(sheetUrl, tabName, rowData) {
    if (!this.sheets) {
      if (!this.authenticate()) {
        throw new Error(`Google Sheets authentication failed: Credentials file '${this.credentialsPath}' not found.`);
      }
    }

    try {
      const spreadsheetId = this.getSpreadsheetId(sheetUrl);
      const range = `${tabName}!A1`;
      
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [rowData],
        },
      });
    } catch (error) {
      console.error("GSheets Sync Error:", error);
      throw new Error(`Failed to append record to Google Sheets: ${error.message}`);
    }
  }

  async getAllRecords(sheetUrl, tabName) {
    if (!this.sheets) {
      if (!this.authenticate()) {
        throw new Error(`Google Sheets authentication failed: Credentials file '${this.credentialsPath}' not found.`);
      }
    }

    try {
      const spreadsheetId = this.getSpreadsheetId(sheetUrl);
      const range = `${tabName}!A:Z`;
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) return [];

      const headers = rows[0];
      const records = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const record = {};
        headers.forEach((header, index) => {
          record[header] = row[index] !== undefined ? row[index] : "";
        });
        records.push(record);
      }

      return records;
    } catch (error) {
      console.error("GSheets Fetch Error:", error);
      throw new Error(`Failed to fetch Google Sheets records: ${error.message}`);
    }
  }
}

module.exports = GSheetsManager;
