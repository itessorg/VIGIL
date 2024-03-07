# getQuarantinePolicy.ps1  
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

$VerbosePreference = 'SilentlyContinue'  
$InformationPreference = 'SilentlyContinue'  
$WarningPreference = 'SilentlyContinue'  
$ErrorActionPreference = 'Stop'  
$ConfirmPreference = 'None'  
  
Connect-ExchangeOnline -AccessToken $AccessToken -UserPrincipalName $UserPrincipalName -ErrorAction Stop | Out-Null 4>&1  
  
$quarantinePolicies = Get-QuarantinePolicy | Select-Object Identity | ConvertTo-Json -ErrorAction Stop  
  
Write-Output $quarantinePolicies.Trim() 
  
Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue | Out-Null  
