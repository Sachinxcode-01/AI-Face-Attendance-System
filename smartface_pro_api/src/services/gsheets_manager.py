import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os

class GSheetsManager:
    def __init__(self, credentials_path='credentials.json'):
        self.scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        self.creds = None
        self.client = None
        self.creds_path = credentials_path

    def authenticate(self):
        if os.path.exists(self.creds_path):
            self.creds = ServiceAccountCredentials.from_json_keyfile_name(self.creds_path, self.scope)
            self.client = gspread.authorize(self.creds)
            return True
        return False

    def get_sheet(self, sheet_url, tab_name):
        if not self.client:
            if not self.authenticate():
                raise RuntimeError(
                    f"Google Sheets authentication failed: Credentials file '{self.creds_path}' not found, or authorization failed."
                )
        if not self.client:
            raise RuntimeError("Google Sheets client is not authenticated.")
        
        try:
            sheet = self.client.open_by_url(sheet_url)
            return sheet.worksheet(tab_name)
        except gspread.exceptions.APIError as e:
            raise RuntimeError(f"Google Sheets API error: {e}")
        except gspread.exceptions.SpreadsheetNotFound:
            raise RuntimeError(f"Google Sheet not found at URL: {sheet_url}")
        except gspread.exceptions.WorksheetNotFound:
            raise RuntimeError(f"Worksheet tab '{tab_name}' not found in the spreadsheet.")
        except Exception as e:
            raise RuntimeError(f"Failed to access Google Sheet: {e}")

    def get_all_records(self, sheet_url, tab_name):
        worksheet = self.get_sheet(sheet_url, tab_name)
        try:
            return worksheet.get_all_records()
        except Exception as e:
            raise RuntimeError(f"Failed to fetch records from sheet: {e}")

    def add_record(self, sheet_url, tab_name, row_data):
        worksheet = self.get_sheet(sheet_url, tab_name)
        try:
            worksheet.append_row(row_data)
        except Exception as e:
            raise RuntimeError(f"Failed to add record to sheet: {e}")
