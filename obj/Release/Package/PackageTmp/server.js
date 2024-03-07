require('dotenv').config();
const express = require('express');
const session = require('express-session');
const msal = require('@azure/msal-node');
const path = require('path');
require('colors'); // Ensuring we are using 'colors' for enhanced console log styling
const { fetchAntiPhishingPolicies } = require('./getAntiPhishingPolicies'); // Correct import to match the exported function name
const { fetchAntiSpamPolicies } = require('./getAntiSpamPolicies');
const { fetchAntiMalwarePolicies } = require('./getAntiMalwarePolicies');
const { fetchSafeLinksPolicies } = require('./getSafeLinksPolicies');
const { fetchSafeAttachmentsPolicies } = require('./getSafeAttachmentsPolicies');
const { fetchQuarantinePolicies } = require('./getQuarantinePolicies');

const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI_BASE = process.env.REDIRECT_URI

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_very_secret_key_here',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }
}));

const MSAL_CONFIG = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/organizations`,
        clientSecret: process.env.CLIENT_SECRET,
    },
    system: {
        loggerOptions: {
            loggerCallback: (logLevel, message, containsPii) => {
                console.log(`MSAL [${logLevel}]: ${message}`.cyan);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

const cca = new msal.ConfidentialClientApplication(MSAL_CONFIG);

const scopes = {
    graph: ['https://graph.microsoft.com/.default'],
    outlook: ['https://outlook.office.com/.default'],
    keyVault: ['https://vault.azure.net/.default']
};


function getAuthCodeUrl(scopes, res, state) {
    const authCodeUrlParameters = {
        scopes: scopes,
        redirectUri: `${REDIRECT_URI_BASE}?state=${state}`,
        prompt: "select_account"
    };
    cca.getAuthCodeUrl(authCodeUrlParameters)
        .then((url) => {
            console.log(`Redirecting to ${state} consent screen...`.green);
            res.redirect(url);
        })
        .catch((err) => console.error(`Error obtaining auth code URL for ${state}:`.red, err));
}

app.get('/', (req, res) => {
    console.log('Serving cybersecurityassessment.html'); // Add logging    
    res.sendFile(path.join(__dirname, 'public', 'cybersecurityassessment.html'));
});

app.get('/auth/login', (req, res) => {
    console.log('Initiating login process with Microsoft Graph consent...'.green);
    getAuthCodeUrl(scopes.graph, res, 'graph');
});



app.get('/redirect', async (req, res) => {
    const { state, code } = req.query;

    if (!code) {
        console.error('No code received.'.red);
        return res.status(400).send('No code received.');
    }

    try {
        const tokenRequest = {
            code,
            scopes: state === 'graph' ? scopes.graph : state === 'outlook' ? scopes.outlook : scopes.keyVault,
            redirectUri: `${REDIRECT_URI_BASE}?state=${state}`,
        };

        const response = await cca.acquireTokenByCode(tokenRequest);
        console.log(`${state.toUpperCase()} Token acquired`.cyan);

        req.session[state + 'Token'] = response.accessToken;

        if (response.account) {
            req.session.userInfo = { name: response.account.name, email: response.account.username };
        }

        // Redirect directly to the main app page after acquiring all necessary tokens    
        if (state === 'graph') {
            return getAuthCodeUrl(scopes.outlook, res, 'outlook');
        } else if (state === 'outlook') {
            return getAuthCodeUrl(scopes.keyVault, res, 'keyvault');
        } else if (state === 'keyvault') {
            // Redirect to cybersecurityassessment.html after all tokens are acquired  
            res.redirect('/cybersecurityassessment');
        }
    } catch (error) {
        console.error(`Error during token acquisition for ${state}:`.red, error);
        res.status(500).send('Error during token acquisition.');
    }
});


// Endpoint to provide basic user info
app.get('/api/userinfo', (req, res) => {
    const userInfo = req.session.userInfo || {};
    res.json({ userName: userInfo.name || 'User not signed in' });
});

app.get('/success', (req, res) => {
    res.send(`
        <script src="/scripts/successPopup.js"></script>
    `);
});



// Function to filter policy names from raw output
function filterPolicyNames(rawOutput) {
    console.log("Policies Names filtering in: ", rawOutput);

    // Check if the raw output is an array
    if (!Array.isArray(rawOutput)) {
        // If rawOutput is not an array, convert it to an array
        rawOutput = [rawOutput];
    }

    // Initialize an array to store policy names
    const policyNames = [];

    // Iterate over each policy object in the raw output array
    rawOutput.forEach(policy => {
        // Check if the policy object has a "Name" property
        if (policy.hasOwnProperty('Name')) {
            // Add the value of the "Name" property to the policyNames array
            policyNames.push(policy.Name);
        }
    });

    return policyNames;
}


// Helper function to sanitize output and remove duplicates    
function sanitizeOutput(rawOutput) {  
    // Check if rawOutput is a JSON object; if so, wrap it in an array  
    if (rawOutput.trim().startsWith('{')) {  
        rawOutput = '[' + rawOutput + ']';  
    }  
  
    // Remove verbose message and unnecessary lines      
    let sanitizedOutput = rawOutput.replace(/-+[\s\S]+?https:\/\/aka.ms\/exov3-module[\s\S]+?-+/g, '').trim();  
    sanitizedOutput = sanitizedOutput.split('\n').filter(line => !line.trim().startsWith('----')).join('\n').trim();  
  
    // Extract the JSON array from the output  
    const jsonArrayMatch = sanitizedOutput.match(/\[\s*{[\s\S]*?}\s*](?![\s\S]*\[\s*{)/);  
    return jsonArrayMatch ? jsonArrayMatch[0] : '[]';  
}  


// Helper function to extract unique policy names  
function getUniquePolicyNames(policiesArray) {
    const seenNames = new Set();
    const uniquePolicies = [];

    policiesArray.forEach(policy => {
        if (policy.Name && !seenNames.has(policy.Name)) {
            seenNames.add(policy.Name);
            uniquePolicies.push(policy);
        }
    });

    return uniquePolicies;
}

function transformPolicyIdentity(identity) {
    // Remove the domain name (everything before and including the backslash)  
    let transformedIdentity = identity.substring(identity.indexOf('\\') + 1);

    // Add a space before each capital letter, but not at the beginning of the string  
    transformedIdentity = transformedIdentity.replace(/([A-Z])/g, ' $1').trim();

    return transformedIdentity;
}

// Endpoint to trigger PowerShell script and fetch anti-phishing policies      
app.get('/api/antiPhishingPolicies', async (req, res) => {  
    console.log(" >> Starting: Fetching Anti-Phishing Policies <<".yellow);  
    const exchangeOnlineToken = req.session.outlookToken;  
    const userPrincipalName = req.session.userInfo.email;  
  
    try {  
        const rawOutput = await fetchAntiPhishingPolicies(exchangeOnlineToken, userPrincipalName);  
        console.log("Raw Anti-Phishing Output:", rawOutput);  
  
        const sanitizedOutput = sanitizeOutput(rawOutput);  
        console.log("Sanitized Anti-Phishing Output:", sanitizedOutput);  
  
        const policiesArray = JSON.parse(sanitizedOutput);  
        const identities = policiesArray.map(policy => ({ Identity: policy.Identity }));  
        res.json({ policies: identities });  
  
        console.log("Anti-Phishing Policies extracted:", identities);  
    } catch (error) {  
        console.error('Error fetching Anti-Phishing policies:', error);  
        res.status(500).send('Error fetching Anti-Phishing policies');  
    }  
});  
  
// Endpoint to trigger PowerShell script and fetch anti-spam policies        
app.get('/api/antiSpamPolicies', async (req, res) => {  
    console.log(" >> Starting: Fetching Anti-Spam Policies <<".yellow);  
    const exchangeOnlineToken = req.session.outlookToken;  
    const userPrincipalName = req.session.userInfo.email;  
  
    try {  
        const rawOutput = await fetchAntiSpamPolicies(exchangeOnlineToken, userPrincipalName);  
        console.log("Raw Anti-Spam Output:", rawOutput);  
  
        const sanitizedOutput = sanitizeOutput(rawOutput);  
        console.log("Sanitized Anti-Spam Output:", sanitizedOutput);  
  
        const policiesArray = JSON.parse(sanitizedOutput);  
        const identities = policiesArray.map(policy => ({ Identity: policy.Identity }));  
        res.json({ policies: identities });  
  
        console.log("Anti-Spam Policies extracted:", identities);  
    } catch (error) {  
        console.error('Error fetching Anti-Spam policies:', error);  
        res.status(500).send('Error fetching Anti-Spam policies');  
    }  
});  
  
// Endpoint to trigger PowerShell script and fetch anti-malware policies    
app.get('/api/antiMalwarePolicies', async (req, res) => {  
    console.log(" >> Starting: Fetching Anti-Malware Policies <<".yellow);  
    const exchangeOnlineToken = req.session.outlookToken;  
    const userPrincipalName = req.session.userInfo.email;  
  
    try {  
        const rawOutput = await fetchAntiMalwarePolicies(exchangeOnlineToken, userPrincipalName);  
        console.log("Raw Anti-Malware Output:", rawOutput);  
  
        const sanitizedOutput = sanitizeOutput(rawOutput);  
        console.log("Sanitized Anti-Malware Output:", sanitizedOutput);  
  
        const policiesArray = JSON.parse(sanitizedOutput);  
        res.json({ policies: policiesArray });  
  
        console.log("Anti-Malware Policies extracted:", policiesArray);  
    } catch (error) {  
        console.error('Error fetching Anti-Malware policies:', error);  
        res.status(500).send('Error fetching Anti-Malware policies');  
    }  
});  
  
// Endpoint to trigger PowerShell script and fetch Safe Links policies    
app.get('/api/safeLinksPolicies', async (req, res) => {  
    console.log(" >> Starting: Fetching Safe Links Policies <<".yellow);  
    const exchangeOnlineToken = req.session.outlookToken;  
    const userPrincipalName = req.session.userInfo.email;  
  
    try {  
        const rawOutput = await fetchSafeLinksPolicies(exchangeOnlineToken, userPrincipalName);  
        console.log("Raw Safe Links Output:", rawOutput);  
  
        const sanitizedOutput = sanitizeOutput(rawOutput);  
        console.log("Sanitized Safe Links Output:", sanitizedOutput);  
  
        const policiesArray = JSON.parse(sanitizedOutput);  
        res.json({ policies: policiesArray });  
  
        console.log("Safe Links Policies extracted:", policiesArray);  
    } catch (error) {  
        console.error('Error fetching Safe Links policies:', error);  
        res.status(500).send('Error fetching Safe Links policies');  
    }  
});  
  
// Endpoint to trigger PowerShell script and fetch Safe Attachment policies    
app.get('/api/safeAttachmentsPolicies', async (req, res) => {  
    console.log(" >> Starting: Fetching Safe Attachments Policies <<".yellow);  
    const exchangeOnlineToken = req.session.outlookToken;  
    const userPrincipalName = req.session.userInfo.email;  
  
    try {  
        const rawOutput = await fetchSafeAttachmentsPolicies(exchangeOnlineToken, userPrincipalName);  
        console.log("Raw Safe Attachments Output:", rawOutput);  
  
        const sanitizedOutput = sanitizeOutput(rawOutput);  
        console.log("Sanitized Safe Attachments Output:", sanitizedOutput);  
  
        const policiesArray = JSON.parse(sanitizedOutput);  
        res.json({ policies: policiesArray });  
  
        console.log("Safe Attachments Policies extracted:", policiesArray);  
    } catch (error) {  
        console.error('Error fetching Safe Attachments policies:', error);  
        res.status(500).send('Error fetching Safe Attachments policies');  
    }  
});  
  
// Endpoint to trigger PowerShell script and fetch Quarantine policies      
app.get('/api/quarantinePolicies', async (req, res) => {  
    console.log(" >> Starting: Fetching Quarantine Policies <<".yellow);  
    const exchangeOnlineToken = req.session.outlookToken;  
    const userPrincipalName = req.session.userInfo.email;  
  
    try {  
        const rawOutput = await fetchQuarantinePolicies(exchangeOnlineToken, userPrincipalName);  
        console.log("Raw Quarantine Output:", rawOutput);  
  
        const sanitizedOutput = sanitizeOutput(rawOutput);  
        console.log("Sanitized Quarantine Output:", sanitizedOutput);  
  
        const policiesArray = JSON.parse(sanitizedOutput);  
  
        // Transform each policy identity using the helper function    
        const transformedPolicies = policiesArray.map(policy => {  
            return { Identity: transformPolicyIdentity(policy.Identity) };  
        });  
  
        res.json({ policies: transformedPolicies });  
  
        console.log("Quarantine Policies extracted:", transformedPolicies);  
    } catch (error) {  
        console.error('Error fetching Quarantine policies:', error);  
        res.status(500).send('Error fetching Quarantine policies');  
    }  
});  


// Route to serve cybersecurityassessment.html explicitly  
app.get('/cybersecurityassessment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cybersecurityassessment.html'));
});


app.listen(SERVER_PORT, () => {
    console.log(`Server running on http://localhost:${SERVER_PORT}`.bgBlue);
});
