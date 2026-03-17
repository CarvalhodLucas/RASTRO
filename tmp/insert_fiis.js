const fs = require('fs');

const dataFile = 'c:/Users/Lucas/Documents/RASTRO/src/lib/data.ts';
let dataTsContent = fs.readFileSync(dataFile, 'utf-8');

const newFiisContent = fs.readFileSync('c:/Users/Lucas/Documents/RASTRO/tmp/new_fiis.txt', 'utf-8');

// The b3Assets array ends exactly before export const cryptoAssets: Asset[] = [
// So we can find the end of b3Assets by looking for:
//     }
// ];
// 
// export const cryptoAssets

const target = `    }
];

export const cryptoAssets`;

if (dataTsContent.includes(target)) {
    const replacement = `    },
${newFiisContent}
];

export const cryptoAssets`;
    dataTsContent = dataTsContent.replace(target, replacement);
    fs.writeFileSync(dataFile, dataTsContent);
    console.log("Successfully injected 30 FIIs into data.ts.");
} else {
    console.log("Target block not found. Checking exactly how b3Assets ends.");
}
