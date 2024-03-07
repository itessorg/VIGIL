# getAntiPhishPolicyFL.ps1  
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
  
# Get the Anti-Phish Policies and convert them to a full list  
$antiPhishPolicies = Get-AntiPhishPolicy | Format-List | Out-String  
  
# Write the full list output to the console  
Write-Output $antiPhishPolicies  
  
# Disconnect the session  
Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue | Out-Null  
