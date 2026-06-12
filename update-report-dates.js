const fs = require('fs');
const path = require('path');

const reportsDir = path.join(__dirname, 'public', 'reports');
const outputFile = path.join(__dirname, 'public', 'reports-dates.json');

function updateDates() {
    if (!fs.existsSync(reportsDir)) {
        console.log('Directory public/reports does not exist.');
        return;
    }

    const files = fs.readdirSync(reportsDir);
    const dates = {};

    // Load existing dates if they exist so we don't overwrite with older dates by mistake, 
    // although locally the mtime should be accurate.
    if (fs.existsSync(outputFile)) {
        try {
            Object.assign(dates, JSON.parse(fs.readFileSync(outputFile, 'utf8')));
        } catch (e) {
            console.error('Error reading existing reports-dates.json', e);
        }
    }

    let updatedCount = 0;

    files.forEach(file => {
        if (file.toLowerCase().endsWith('.html') || file.toLowerCase().endsWith('.htm') || file.toLowerCase().endsWith('.pdf')) {
            const filePath = path.join(reportsDir, file);
            const stats = fs.statSync(filePath);
            const mtime = stats.mtime.toISOString();
            
            // Update if not exists or if the file is newer than what we have
            if (!dates[file] || new Date(mtime) > new Date(dates[file])) {
                dates[file] = mtime;
                updatedCount++;
            }
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(dates, null, 2));
    console.log(`✅ Report dates updated successfully! ${updatedCount} files updated in public/reports-dates.json`);
}

updateDates();
