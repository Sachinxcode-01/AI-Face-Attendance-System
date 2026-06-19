# Powershell script to export SVG to PNG using ImageMagick or Inkscape (if installed)
# Usage: .\svg_to_png.ps1 -Input .\assets\logos\logo.svg -Output .\assets\logos\logo_light.png -Width 512 -Height 512
param(
  [Parameter(Mandatory=$true)] [string]$Input,
  [Parameter(Mandatory=$true)] [string]$Output,
  [int]$Width = 512,
  [int]$Height = 512
)

# Try ImageMagick (magick)
if (Get-Command magick -ErrorAction SilentlyContinue) {
  Write-Host "Using ImageMagick to convert $Input -> $Output"
  magick convert -background none -resize ${Width}x${Height} "$Input" "$Output"
  exit $LASTEXITCODE
}

# Try Inkscape
if (Get-Command inkscape -ErrorAction SilentlyContinue) {
  Write-Host "Using Inkscape to export $Input -> $Output"
  inkscape "$Input" --export-type=png --export-filename="$Output" --export-width=$Width --export-height=$Height
  exit $LASTEXITCODE
}

Write-Error "No supported SVG converter found. Install ImageMagick (magick) or Inkscape and retry."; exit 1
