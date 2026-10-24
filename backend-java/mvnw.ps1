$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$MavenVersion = "3.9.9"
$MavenDir = Join-Path $ScriptDir ".mvn\wrapper\apache-maven-$MavenVersion"
$MavenZip = Join-Path $ScriptDir ".mvn\wrapper\apache-maven-$MavenVersion-bin.zip"
$MvnExe = Join-Path $MavenDir "bin\mvn.cmd"

if (-not (Test-Path $MvnExe)) {
    Write-Host "[INFO] Maven not found. Downloading Apache Maven $MavenVersion wrapper..."
    $Url = "https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/$MavenVersion/apache-maven-$MavenVersion-bin.zip"
    $WrapperDir = Join-Path $ScriptDir ".mvn\wrapper"
    if (-not (Test-Path $WrapperDir)) { New-Item -ItemType Directory -Path $WrapperDir -Force | Out-Null }
    
    Invoke-WebRequest -Uri $Url -OutFile $MavenZip
    Write-Host "[INFO] Extracting Maven distribution..."
    Expand-Archive -Path $MavenZip -DestinationPath (Join-Path $ScriptDir ".mvn\wrapper") -Force
    Remove-Item $MavenZip -Force -ErrorAction SilentlyContinue
}

& $MvnExe $args
exit $LASTEXITCODE
