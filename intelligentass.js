// intelligentass.js  
// You would include the script for AzureOpenAI or make fetch requests to your server  
// which would then interact with Azure OpenAI  
  
function getHumanReadablePolicyDescriptions(powershellOutput) {  
  const apiEndpoint = "https://stf-magik.openai.azure.com/openai/deployments/stf-Magik-alphaPlus/chat/completions?api-version=2024-02-15-preview";  
  const apiKey = "3ba9417256e943ada28645d812f17db2"; // Should be stored securely  

  // Construct the payload  
  const messageText = [  
      {  
          "role": "system",  
          "content": "You are analyzing a PowerShell output for email security policies. Your task is to generate a human-readable description for each policy."  
      },  
      {  
          "role": "user",  
          "content": powershellOutput  
      }  
  ];  

  // Make the request to Azure OpenAI  
  fetch(apiEndpoint, {  
      method: "POST",  
      headers: {  
          "Content-Type": "application/json",  
          "Authorization": `Bearer ${apiKey}`  
      },  
      body: JSON.stringify({  
          model: "stf-Magik-alphaPlus",  
          messages: messageText,  
          temperature: 0.7,  
          max_tokens: 4096,  
          top_p: 0.95,  
          frequency_penalty: 0,  
          presence_penalty: 0  
      })  
  })  
  .then(response => response.json())  
  .then(data => {  
      // Extract the text response from OpenAI  
      const openAIResponse = data.choices[0].message.content;  
      // Update the HTML content  
      document.querySelector('.auto-group-vq2e-EoQ .text-holder-text-holder-text-holder-text-holder-text-holder-text-holder-text-holder-text-holder-text-holder-text-holder-text-holder-text-holder-Tw4').innerHTML = openAIResponse;  
  })  
  .catch(error => {  
      console.error('Error interacting with Azure OpenAI:', error);  
  });  
}  

function fetchFullListOutput() {  
  // This function should be implemented to fetch the full list output from your server  
  // For now, it's just a placeholder function  
  return Promise.resolve("Example PowerShell output");  
}  

// Event listener for the ANTI-PHISHING click  
document.getElementById('anti-phishing-policy').addEventListener('click', function() {  
  fetchFullListOutput()  
      .then(powershellOutput => {  
          getHumanReadablePolicyDescriptions(powershellOutput);  
      });  
});  
