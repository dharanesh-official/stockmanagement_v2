import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file
 * @param {Array} data - The array of objects to export
 * @param {string} fileName - The name of the file (without extension)
 * @param {string} sheetName - The name of the worksheet
 */
export const exportToExcel = (data, fileName = 'Export', sheetName = 'Data') => {
    try {
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
    } catch (error) {
        console.error('Excel Export Error:', error);
        alert('Failed to export Excel file');
    }
};
