// getSafeAttachmentsPolicies.js  
const { spawn } = require('child_process');  
const path = require('path');  
  
function fetchSafeAttachmentsPolicies(exchangeOnlineToken, userPrincipalName) {  
    return new Promise((resolve, reject) => {  
        const scriptPath = path.join(__dirname, 'scripts', 'getSafeAttachmentsPolicy.ps1');  
        const ps = spawn('powershell.exe', [  
            '-NoProfile',  
            '-NonInteractive',  
            '-ExecutionPolicy', 'Bypass',  
            '-File', scriptPath,  
            '-AccessToken', exchangeOnlineToken,  
            '-UserPrincipalName', userPrincipalName  
        ], {  
            stdio: ['ignore', 'pipe', 'pipe']  
        });  
  
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
                resolve(output);  
            } else {  
                reject(`PowerShell script exited with code ${code}.`);  
            }  
        });  
    });  
}  
  
module.exports = { fetchSafeAttachmentsPolicies };  
