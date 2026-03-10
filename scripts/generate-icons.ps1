param(
  [string]$SourcePath = "$env:USERPROFILE\Desktop\Icon 1.jpg"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourcePath)) {
  throw "Arquivo de icone nao encontrado: $SourcePath"
}

Add-Type -AssemblyName System.Drawing

function New-SquarePng {
  param(
    [System.Drawing.Image]$SourceImage,
    [string]$DestinationPath,
    [int]$Size,
    [switch]$CircleMask,
    [double]$InsetPercent = 0
  )

  $directory = Split-Path -Parent $DestinationPath
  if ($directory -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $drawX = 0
  $drawY = 0
  $drawSize = $Size

  if ($InsetPercent -gt 0) {
    $padding = [int][Math]::Round($Size * $InsetPercent)
    $drawX = $padding
    $drawY = $padding
    $drawSize = $Size - ($padding * 2)
  }

  if ($CircleMask) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddEllipse($drawX, $drawY, $drawSize, $drawSize)
    $graphics.SetClip($path)
  }

  $graphics.DrawImage($SourceImage, $drawX, $drawY, $drawSize, $drawSize)
  $bitmap.Save($DestinationPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
}

$source = [System.Drawing.Image]::FromFile($SourcePath)

try {
  New-SquarePng -SourceImage $source -DestinationPath "public/icons/icon-192.png" -Size 192
  New-SquarePng -SourceImage $source -DestinationPath "public/icons/icon-512.png" -Size 512
  New-SquarePng -SourceImage $source -DestinationPath "public/icons/apple-touch-icon.png" -Size 180
  New-SquarePng -SourceImage $source -DestinationPath "public/icons/icon-1024.png" -Size 1024
  New-SquarePng -SourceImage $source -DestinationPath "resources/icon-1024.png" -Size 1024

  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-mdpi/ic_launcher.png" -Size 48
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-hdpi/ic_launcher.png" -Size 72
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png" -Size 96
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png" -Size 144
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png" -Size 192

  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png" -Size 48 -CircleMask
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png" -Size 72 -CircleMask
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png" -Size 96 -CircleMask
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png" -Size 144 -CircleMask
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png" -Size 192 -CircleMask

  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png" -Size 108 -InsetPercent 0.18
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png" -Size 162 -InsetPercent 0.18
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png" -Size 216 -InsetPercent 0.18
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png" -Size 324 -InsetPercent 0.18
  New-SquarePng -SourceImage $source -DestinationPath "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png" -Size 432 -InsetPercent 0.18
}
finally {
  $source.Dispose()
}

Write-Output "Icones gerados com sucesso a partir de: $SourcePath"
