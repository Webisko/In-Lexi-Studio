param(
  [Parameter(Mandatory = $true)] [string]$Host,
  [Parameter(Mandatory = $true)] [string]$User,
  [Parameter(Mandatory = $true)] [string]$KeyPath,
  [int]$Port = 22,
  [string]$FrontendPath = 'domains/inlexistudio.com/public_html',
  [string]$CmsPath = 'domains/inlexistudio.com/cms-app',
  [string]$AdminPath = 'domains/admin.inlexistudio.com/public_html'
)

$ErrorActionPreference = 'Stop'

$env:PUBLIC_API_URL = 'https://inlexistudio.com/app/api'
$env:PUBLIC_BASE_URL = 'https://inlexistudio.com/app'

Write-Host 'Building frontend with production API/base URLs...'
npm run build:prod

Write-Host 'Deploying frontend...'
scp -i $KeyPath -P $Port -r dist\* "$User@${Host}:$FrontendPath/"

Write-Host 'Deploying backend runtime files...'
scp -i $KeyPath -P $Port -r api prisma admin app.js package.json package-lock.json "$User@${Host}:$CmsPath/"

Write-Host 'Deploying admin app...'
scp -i $KeyPath -P $Port -r admin\* "$User@${Host}:$AdminPath/"

Write-Host 'Normalizing permissions and restarting app...'
ssh -i $KeyPath -p $Port "$User@$Host" @"
find $FrontendPath -type d -exec chmod 755 {} \;
find $FrontendPath -type f -exec chmod 644 {} \;
find $AdminPath -type d -exec chmod 755 {} \;
find $AdminPath -type f -exec chmod 644 {} \;
cd $CmsPath
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
source /home/$User/nodevenv/domains/inlexistudio.com/cms-app/22/bin/activate
npm install --production
npx prisma generate
touch app.js
"@