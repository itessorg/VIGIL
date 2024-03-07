# exchangeOnlineAuth.ps1  
#Param(  
#    [string]$AccessToken,  
#    [string]$UserPrincipalName  
#)  
  
# Suppress all unnecessary output  
# $ErrorActionPreference = "SilentlyContinue"  
# $WarningPreference = "SilentlyContinue"  
# $InformationPreference = "SilentlyContinue"  
# $VerbosePreference = "SilentlyContinue"  
  
# Import the ExchangeOnlineManagement module and suppress the banner  
# 
  
# Connect to Exchange Online with the access token and suppress output  
# Connect-ExchangeOnline -AccessToken $AccessToken -UserPrincipalName $UserPrincipalName -ErrorAction Stop | Out-Null 4>&1 
  
# Retrieve anti-phish policies and output as JSON  
# $antiPhishPolicies = Get-AntiPhishPolicy | Select-Object Name | ConvertTo-Json -ErrorAction Stop | Out-String  
  
# Write the JSON to the output, trimming any leading/trailing whitespace and newlines  
# Write-Output $antiPhishPolicies.Trim()  
  
# Disconnect the Exchange Online session and suppress output  
# Disconnect-ExchangeOnline -Confirm:$false -ErrorAction SilentlyContinue | Out-Null  
