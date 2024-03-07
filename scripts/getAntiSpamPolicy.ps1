# getAntiSpamPolicy.ps1    
Param(  
    [string]$AccessToken,  
    [string]$UserPrincipalName  
)  
  

# Suppress all output except the JSON result  
$VerbosePreference = 'SilentlyContinue'  
$InformationPreference = 'SilentlyContinue'  
$WarningPreference = 'SilentlyContinue'  
$ErrorActionPreference = 'Stop'  
$ConfirmPreference = 'None'  
  
# Import-Module ExchangeOnlineManagement -DisableNameChecking -ErrorAction Stop | Out-Null  
Import-Module ".\ExchangeOnlineManagement\3.4.0\ExchangeOnlineManagement.psd1" -Force

# Connect to Exchange Online with the access token      
Connect-ExchangeOnline -AccessToken $AccessToken -UserPrincipalName $UserPrincipalName -ErrorAction Stop | Out-Null 4>&1      
  
# Get the Inbound Anti-Spam Policies        
$inboundPolicies = @(Get-HostedContentFilterPolicy | Select-Object Identity)  
  
# Get the Outbound Anti-Spam Policies        
$outboundPolicies = @(Get-HostedOutboundSpamFilterPolicy | Select-Object Identity)  
  
# Combine the arrays  
$allPolicies = $inboundPolicies + $outboundPolicies
  
# Convert the combined policies to JSON        
$jsonPolicies = $allPolicies | ConvertTo-Json -ErrorAction Stop      

# Write the JSON to the output, trimming any leading/trailing whitespace and newlines        
Write-Output $jsonPolicies.Trim()      
  
# Disconnect the session      
Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue | Out-Null 