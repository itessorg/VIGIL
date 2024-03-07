// antiphishingpolicies.js
const { spawn } = require('child_process');
const path = require('path');

function fetchAntiPhishingPolicies(accessToken, userPrincipalName) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, 'scripts', 'getAntiPhishPolicy.ps1');
        const ps = spawn('powershell.exe', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath,
            '-AccessToken', accessToken,
            '-UserPrincipalName', userPrincipalName
        ]);

        let output = '';
        ps.stdout.on('data', (data) => {
            output += data.toString();
        });

        ps.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            reject(data.toString());
        });

        ps.on('close', (code) => {
            if (code === 0) {
                console.log('PowerShell script executed successfully.');
                resolve(output);
            } else {
                console.error(`PowerShell script exited with code ${code}.`);
                reject(`PowerShell script exited with code ${code}.`);
            }
        });
    });
}

module.exports = { fetchAntiPhishingPolicies };
