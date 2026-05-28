Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$width = 1242
$height = 1660
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$outDir = Join-Path $root 'docs\public\xiaohongshu'
$outFile = Join-Path $outDir 'street-photo-neon-rain.png'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function Color-Hex {
    param([string]$Hex, [int]$Alpha = 255)
    $h = $Hex.TrimStart('#')
    $r = [Convert]::ToInt32($h.Substring(0, 2), 16)
    $g = [Convert]::ToInt32($h.Substring(2, 2), 16)
    $b = [Convert]::ToInt32($h.Substring(4, 2), 16)
    return [System.Drawing.Color]::FromArgb($Alpha, $r, $g, $b)
}

function Pt {
    param([float]$X, [float]$Y)
    return [System.Drawing.PointF]::new($X, $Y)
}

function Fill-Rect {
    param($Graphics, [string]$Hex, [int]$Alpha, [float]$X, [float]$Y, [float]$W, [float]$H)
    $brush = [System.Drawing.SolidBrush]::new((Color-Hex $Hex $Alpha))
    $Graphics.FillRectangle($brush, $X, $Y, $W, $H)
    $brush.Dispose()
}

function Fill-Ellipse {
    param($Graphics, [string]$Hex, [int]$Alpha, [float]$X, [float]$Y, [float]$W, [float]$H)
    $brush = [System.Drawing.SolidBrush]::new((Color-Hex $Hex $Alpha))
    $Graphics.FillEllipse($brush, $X, $Y, $W, $H)
    $brush.Dispose()
}

function Draw-Line {
    param($Graphics, [string]$Hex, [int]$Alpha, [float]$Width, [float]$X1, [float]$Y1, [float]$X2, [float]$Y2)
    $pen = [System.Drawing.Pen]::new((Color-Hex $Hex $Alpha), $Width)
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $Graphics.DrawLine($pen, $X1, $Y1, $X2, $Y2)
    $pen.Dispose()
}

function New-RoundedRectPath {
    param([float]$X, [float]$Y, [float]$W, [float]$H, [float]$R)
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $d = $R * 2
    $path.AddArc($X, $Y, $d, $d, 180, 90)
    $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
    $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
    $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Fill-Polygon {
    param($Graphics, [string]$Hex, [int]$Alpha, [System.Drawing.PointF[]]$Points)
    $brush = [System.Drawing.SolidBrush]::new((Color-Hex $Hex $Alpha))
    $Graphics.FillPolygon($brush, $Points)
    $brush.Dispose()
}

$bitmap = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bitmap)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

# Twilight sky gradient
$rect = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
$sky = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, (Color-Hex '#07111F'), (Color-Hex '#251328'), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$blend = [System.Drawing.Drawing2D.ColorBlend]::new()
$blend.Positions = [single[]](0.0, 0.34, 0.62, 1.0)
$blend.Colors = [System.Drawing.Color[]]@((Color-Hex '#07111F'), (Color-Hex '#182A49'), (Color-Hex '#4C2E62'), (Color-Hex '#160D18'))
$sky.InterpolationColors = $blend
$g.FillRectangle($sky, $rect)
$sky.Dispose()

$rng = [System.Random]::new(4262026)

# Atmospheric glow behind the street
foreach ($glow in @(
    @{x=210;y=520;r=330;c='#30E0FF';a=26},
    @{x=890;y=500;r=380;c='#FF427E';a=28},
    @{x=590;y=730;r=560;c='#FFD37A';a=17}
)) {
    for ($k = 4; $k -ge 1; $k--) {
        $rr = $glow.r * $k / 4
        Fill-Ellipse $g $glow.c ([int]($glow.a / $k)) ($glow.x - $rr) ($glow.y - $rr) ($rr * 2) ($rr * 2)
    }
}

# Distant skyline
$x = -50
while ($x -lt $width + 80) {
    $bw = $rng.Next(78, 150)
    $bh = $rng.Next(260, 560)
    $by = 830 - $bh + $rng.Next(-30, 40)
    Fill-Rect $g '#08101D' 230 $x $by $bw $bh
    Fill-Rect $g '#122038' 130 ($x + 6) ($by + 8) ($bw - 12) ($bh - 8)

    for ($wx = $x + 16; $wx -lt $x + $bw - 16; $wx += 28) {
        for ($wy = $by + 28; $wy -lt 820; $wy += 44) {
            if ($rng.NextDouble() -lt 0.34) {
                $wc = if ($rng.NextDouble() -lt 0.48) { '#F8D98B' } elseif ($rng.NextDouble() -lt 0.5) { '#5FE9FF' } else { '#FF5D95' }
                Fill-Rect $g $wc $rng.Next(42, 95) $wx $wy 10 20
            }
        }
    }
    $x += $bw + $rng.Next(10, 35)
}

# Midground shop fronts and neon signs
Fill-Rect $g '#050912' 210 0 782 $width 225
foreach ($sign in @(
    @{x=70;y=620;w=86;h=260;c='#FF3A75';text="咖`n啡"},
    @{x=1040;y=560;w=96;h=310;c='#39E6FF';text="夜`n色"},
    @{x=224;y=704;w=190;h=72;c='#FFD36A';text='STUDIO'},
    @{x=805;y=684;w=205;h=78;c='#FF6DAE';text='SNAP'}
)) {
    $path = New-RoundedRectPath $sign.x $sign.y $sign.w $sign.h 16
    $brush = [System.Drawing.SolidBrush]::new((Color-Hex $sign.c 50))
    $g.FillPath($brush, $path)
    $brush.Dispose()
    $pen = [System.Drawing.Pen]::new((Color-Hex $sign.c 175), 3)
    $g.DrawPath($pen, $path)
    $pen.Dispose()
    $fontSize = if ($sign.h -gt 100) { 32 } else { 26 }
    $font = [System.Drawing.Font]::new('Microsoft YaHei UI', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf = [System.Drawing.StringFormat]::new()
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $txtBrush = [System.Drawing.SolidBrush]::new((Color-Hex '#FFFFFF' 218))
    $g.DrawString($sign.text, $font, $txtBrush, [System.Drawing.RectangleF]::new($sign.x, $sign.y, $sign.w, $sign.h), $sf)
    $txtBrush.Dispose(); $sf.Dispose(); $font.Dispose(); $path.Dispose()
}

# Soft bokeh lights
$palette = @('#FFD36A', '#FF4B8B', '#47E6FF', '#FFFFFF', '#8B5CFF', '#FF7C4C')
for ($i = 0; $i -lt 150; $i++) {
    $cx = $rng.Next(0, $width)
    $cy = $rng.Next(250, 1080)
    $rad = $rng.Next(8, 48)
    $color = $palette[$rng.Next(0, $palette.Length)]
    for ($layer = 4; $layer -ge 1; $layer--) {
        $alpha = [int](($rng.Next(16, 76)) / $layer)
        $rr = $rad * $layer / 2
        Fill-Ellipse $g $color $alpha ($cx - $rr) ($cy - $rr) ($rr * 2) ($rr * 2)
    }
}

# Rainy street perspective
$road = [System.Drawing.PointF[]]@((Pt 0 965), (Pt $width 965), (Pt 1010 $height), (Pt 230 $height))
Fill-Polygon $g '#05080F' 238 $road
$centerWet = [System.Drawing.PointF[]]@((Pt 420 965), (Pt 820 965), (Pt 760 $height), (Pt 490 $height))
Fill-Polygon $g '#162236' 90 $centerWet
$leftWalk = [System.Drawing.PointF[]]@((Pt 0 905), (Pt 278 955), (Pt 214 $height), (Pt 0 $height))
$rightWalk = [System.Drawing.PointF[]]@((Pt 964 955), (Pt $width 905), (Pt $width $height), (Pt 1028 $height))
Fill-Polygon $g '#111323' 220 $leftWalk
Fill-Polygon $g '#121222' 220 $rightWalk

# Crosswalk and perspective marks
for ($j = 0; $j -lt 8; $j++) {
    $yy = 1038 + $j * 76
    $scale = 1 + $j * 0.095
    $x1 = 392 - $j * 18
    $x2 = 850 + $j * 18
    Draw-Line $g '#F7F2E8' (70 - [Math]::Min(46, $j * 6)) (12 * $scale) $x1 $yy $x2 ($yy + 10)
}
Draw-Line $g '#4EE7FF' 55 3 430 965 292 $height
Draw-Line $g '#FF4D86' 55 3 815 965 954 $height
Draw-Line $g '#F7D775' 40 2 620 960 620 $height

# Wet asphalt reflections and rain texture
for ($i = 0; $i -lt 230; $i++) {
    $rx = $rng.Next(20, $width - 20)
    $ry = $rng.Next(980, $height - 16)
    $rw = $rng.Next(12, 95)
    $color = $palette[$rng.Next(0, $palette.Length)]
    Draw-Line $g $color $rng.Next(15, 58) $rng.Next(1, 4) $rx $ry ($rx + $rw) ($ry + $rng.Next(-4, 5))
}
for ($i = 0; $i -lt 360; $i++) {
    $rx = $rng.Next(0, $width)
    $ry = $rng.Next(100, $height)
    Draw-Line $g '#FFFFFF' $rng.Next(18, 58) 1 $rx $ry ($rx + $rng.Next(-8, 2)) ($ry + $rng.Next(24, 62))
}

# Foreground street photographer silhouette on the left
Fill-Ellipse $g '#000000' 70 130 1322 240 34
Fill-Rect $g '#05070E' 220 200 935 56 300
Fill-Ellipse $g '#090B12' 245 188 872 82 82
Draw-Line $g '#0B0E16' 230 22 228 1025 185 1300
Draw-Line $g '#0B0E16' 230 18 236 1028 292 1290
Fill-Rect $g '#080A12' 235 246 995 74 44
Fill-Ellipse $g '#161A24' 255 302 1001 52 36
Draw-Line $g '#FFFFFF' 95 2 340 1014 610 1000

# Main subject: street style figure
Fill-Ellipse $g '#000000' 86 468 1452 318 42
$coatShadow = [System.Drawing.PointF[]]@((Pt 553 855), (Pt 696 855), (Pt 752 1218), (Pt 490 1218))
Fill-Polygon $g '#02040A' 235 $coatShadow
$coat = [System.Drawing.PointF[]]@((Pt 567 862), (Pt 688 862), (Pt 723 1202), (Pt 518 1202))
Fill-Polygon $g '#111827' 255 $coat
$coatHi = [System.Drawing.PointF[]]@((Pt 585 876), (Pt 630 866), (Pt 612 1194), (Pt 540 1194))
Fill-Polygon $g '#26314A' 126 $coatHi
Draw-Line $g '#F4D76B' 150 3 625 874 614 1192
Draw-Line $g '#FFFFFF' 55 2 569 905 535 1118
Draw-Line $g '#47E6FF' 45 2 686 922 714 1150

# Hoodie and camera strap
Fill-Polygon $g '#F3EEE5' 232 ([System.Drawing.PointF[]]@((Pt 594 870), (Pt 656 870), (Pt 638 975), (Pt 606 975)))
Draw-Line $g '#0A0D15' 210 8 565 900 710 1115
Fill-Rect $g '#0B0E17' 235 681 1078 82 54
Fill-Ellipse $g '#171C28' 255 706 1088 42 42
Fill-Rect $g '#30384B' 190 694 1091 18 12

# Arms and hands
Draw-Line $g '#101522' 245 34 552 934 520 1088
Draw-Line $g '#101522' 245 34 693 940 742 1084
Fill-Ellipse $g '#D7A27B' 238 500 1070 42 44
Fill-Ellipse $g '#D7A27B' 238 727 1065 42 44

# Head / hair / face
Fill-Ellipse $g '#D8A17B' 255 586 778 82 96
Fill-Ellipse $g '#0B0A0E' 245 575 748 112 82
Fill-Ellipse $g '#0B0A0E' 250 646 774 34 70
Draw-Line $g '#111111' 220 4 610 822 658 820
Fill-Ellipse $g '#E9C0A0' 210 616 832 19 13

# Legs and shoes
$leg1 = [System.Drawing.PointF[]]@((Pt 553 1196), (Pt 615 1196), (Pt 606 1452), (Pt 548 1452))
$leg2 = [System.Drawing.PointF[]]@((Pt 640 1198), (Pt 698 1198), (Pt 740 1452), (Pt 681 1452))
Fill-Polygon $g '#080A12' 252 $leg1
Fill-Polygon $g '#090B13' 252 $leg2
Draw-Line $g '#31405B' 115 3 590 1210 578 1440
Draw-Line $g '#31405B' 115 3 666 1212 710 1440
Fill-Ellipse $g '#F7F3E9' 238 526 1433 104 34
Fill-Ellipse $g '#F7F3E9' 238 667 1433 112 34

# Subject rim light
Draw-Line $g '#55E9FF' 95 4 698 882 740 1193
Draw-Line $g '#FF4F91' 92 4 548 883 507 1195
Draw-Line $g '#FFD36A' 72 3 590 782 584 848

# Xiaohongshu-friendly editorial text overlay
$card = New-RoundedRectPath 62 72 505 148 34
$cardBrush = [System.Drawing.SolidBrush]::new((Color-Hex '#07111F' 118))
$g.FillPath($cardBrush, $card)
$cardBrush.Dispose()
$cardPen = [System.Drawing.Pen]::new((Color-Hex '#FFFFFF' 44), 2)
$g.DrawPath($cardPen, $card)
$cardPen.Dispose(); $card.Dispose()

$titleFont = [System.Drawing.Font]::new('Microsoft YaHei UI', 42, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$subFont = [System.Drawing.Font]::new('Segoe UI', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$titleBrush = [System.Drawing.SolidBrush]::new((Color-Hex '#FFFFFF' 235))
$subBrush = [System.Drawing.SolidBrush]::new((Color-Hex '#D6E7FF' 190))
$g.DrawString('雨后城市街拍', $titleFont, $titleBrush, 94, 96)
$g.DrawString('URBAN SNAPSHOT · APR 2026', $subFont, $subBrush, 96, 154)
$titleBrush.Dispose(); $subBrush.Dispose(); $titleFont.Dispose(); $subFont.Dispose()

$tagFont = [System.Drawing.Font]::new('Microsoft YaHei UI', 25, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$tagPath = New-RoundedRectPath 706 1492 446 72 28
$tagBg = [System.Drawing.SolidBrush]::new((Color-Hex '#FFFFFF' 42))
$g.FillPath($tagBg, $tagPath)
$tagBg.Dispose()
$tagBrush = [System.Drawing.SolidBrush]::new((Color-Hex '#FFFFFF' 224))
$tagFormat = [System.Drawing.StringFormat]::new()
$tagFormat.Alignment = [System.Drawing.StringAlignment]::Center
$tagFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('#光影 #街头 #氛围感', $tagFont, $tagBrush, [System.Drawing.RectangleF]::new(706, 1492, 446, 72), $tagFormat)
$tagBrush.Dispose(); $tagFormat.Dispose(); $tagFont.Dispose(); $tagPath.Dispose()

# Film grain
for ($i = 0; $i -lt 8500; $i++) {
    $gx = $rng.Next(0, $width)
    $gy = $rng.Next(0, $height)
    $a = $rng.Next(8, 28)
    $grainColor = if ($rng.NextDouble() -lt 0.5) { '#FFFFFF' } else { '#000000' }
    Fill-Rect $g $grainColor $a $gx $gy 1 1
}

# Vignette
for ($i = 0; $i -lt 18; $i++) {
    $alpha = 5 + $i
    $pen = [System.Drawing.Pen]::new((Color-Hex '#000000' $alpha), 22)
    $g.DrawRectangle($pen, 11 + $i * 10, 11 + $i * 10, $width - 22 - $i * 20, $height - 22 - $i * 20)
    $pen.Dispose()
}
Fill-Rect $g '#000000' 42 0 ($height - 130) $width 130

# Final subtle white border
$borderPen = [System.Drawing.Pen]::new((Color-Hex '#FFFFFF' 45), 3)
$g.DrawRectangle($borderPen, 25, 25, $width - 50, $height - 50)
$borderPen.Dispose()

$bitmap.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bitmap.Dispose()

Write-Output "Generated: $outFile"
Write-Output "Size: ${width}x${height}"
