#!/usr/bin/perl
# Applies titles, descriptions and JSON-LD from tools/seo-meta.tsv to every page.
# Idempotent: re-running replaces the previous JSON-LD block. Run from repo root:
#   perl tools/seo-apply.pl
use strict; use warnings; use utf8;
use JSON::PP;
binmode STDOUT, ':utf8';

my $SITE = 'https://seema.qa';
my $PUBLISHED = '2026-10-06';
my $json = JSON::PP->new->utf8(0)->canonical(1);

sub esc { my $s = shift; $s =~ s/&(?!amp;|#)/&amp;/g; $s =~ s/"/&quot;/g; $s }
sub unesc { my $s = shift; $s =~ s/&amp;/&/g; $s =~ s/&quot;/"/g; $s }

open my $fh, '<:utf8', 'tools/seo-meta.tsv' or die $!;
my @rows;
while (<$fh>) { chomp; s/\r$//; next if /^#/ || !/\S/; push @rows, [split /\t/, $_, -1]; }
close $fh;

for my $r (@rows) {
  my ($file, $kind, $crumb, $title, $desc) = @$r; $desc //= "";
  open my $in, '<:utf8', $file or die "$file: $!"; local $/; my $h = <$in>; close $in;
  my $ar = $file =~ m{^ar/};

  # --- title / description / OG ---
  my $t = esc($title);
  $h =~ s{<title>.*?</title>}{<title>$t</title>}s;
  $h =~ s{(<meta property="og:title" content=")[^"]*}{$1$t};
  if (!($h =~ /<meta name="twitter:title"/)) {
    $h =~ s{(<meta name="twitter:card"[^>]*>)}{$1\n<meta name="twitter:title" content="$t">};
  } else { $h =~ s{(<meta name="twitter:title" content=")[^"]*}{$1$t}; }
  if ($desc ne '') {
    my $d = esc($desc);
    $h =~ s{(<meta name="description" content=")[^"]*}{$1$d};
    $h =~ s{(<meta property="og:description" content=")[^"]*}{$1$d};
  }
  ($desc) = $h =~ m{<meta name="description" content="([^"]*)"}; $desc = unesc($desc);
  my ($canon) = $h =~ m{<link rel="canonical" href="([^"]+)"};
  my ($img) = $h =~ m{<meta property="og:image" content="([^"]+)"};
  my ($h1) = $h =~ m{<h1[^>]*>(.*?)</h1>}s; $h1 //= $title;
  $h1 =~ s{<svg.*?</svg>}{}gs; $h1 =~ s{<[^>]+>}{ }g; $h1 =~ s/\s+/ /g; $h1 =~ s/^ | $//g; $h1 = unesc($h1);

  # --- internal links: point "home" at the canonical root, not the duplicate home.html ---
  $h =~ s{href="home\.html"}{href="./"}g;
  $h =~ s{href="ar/home\.html"}{href="ar/"}g;
  $h =~ s{href="\.\./home\.html"}{href="../"}g;

  # --- JSON-LD ---
  my $lang = $ar ? 'ar' : 'en';
  my $root = $ar ? "$SITE/ar/" : "$SITE/";
  my %org = (
    '@type' => 'ProfessionalService', '@id' => "$SITE/#org",
    name => 'Seema', alternateName => 'سيمة',
    legalName => 'Seema for Consultations, Digital Services and Website Design',
    url => "$SITE/", email => 'hello@seema.qa',
    logo => { '@type' => 'ImageObject', url => "$SITE/assets/brand/fav/icon-512.png", width => 512, height => 512 },
    image => "$SITE/assets/img/hero-souq-night.jpg",
    description => 'Doha-based agency for brand strategy, bilingual identity, website and app development, ERP systems and IT support for businesses in Qatar and the GCC.',
    foundingDate => '2026', slogan => 'The mark that makes the difference.',
    address => { '@type' => 'PostalAddress', addressLocality => 'Doha', addressCountry => 'QA' },
    knowsLanguage => ['en', 'ar'],
    knowsAbout => ['Brand strategy', 'Brand identity design', 'Website development', 'Mobile app development', 'ERP implementation', 'Digital marketing', 'IT support'],
  );
  $org{areaServed} = [ map { { '@type' => 'Country', name => $_ } } ('Qatar', 'Saudi Arabia', 'United Arab Emirates', 'Kuwait', 'Bahrain', 'Oman') ];
  my @graph = (\%org);

  if ($kind eq 'home') {
    push @graph, { '@type' => 'WebSite', '@id' => "$SITE/#website", url => "$SITE/", name => 'Seema',
                   alternateName => 'سيمة', inLanguage => ['en', 'ar'], publisher => { '@id' => "$SITE/#org" } };
  } else {
    my @items = ([$ar ? 'الرئيسية' : 'Home', $root]);
    my %parent = $ar
      ? (service => ['خدماتنا', "$SITE/ar/services.html"], case => ['أعمالنا', "$SITE/ar/work.html"], article => ['رؤى', "$SITE/ar/insights.html"])
      : (service => ['Services', "$SITE/services.html"], case => ['Work', "$SITE/work.html"], article => ['Insights', "$SITE/insights.html"]);
    push @items, $parent{$kind} if $parent{$kind};
    push @items, [$crumb, $canon];
    my $i = 0;
    push @graph, { '@type' => 'BreadcrumbList', itemListElement => [ map { { '@type' => 'ListItem', position => ++$i, name => $_->[0], item => $_->[1] } } @items ] };
  }
  if ($kind eq 'service') {
    push @graph, { '@type' => 'Service', name => $crumb, serviceType => $crumb, url => $canon, description => $desc,
                   inLanguage => $lang, provider => { '@id' => "$SITE/#org" },
                   areaServed => { '@type' => 'Country', name => 'Qatar' } };
  }
  if ($kind eq 'article') {
    push @graph, { '@type' => 'Article', headline => $h1, description => $desc, image => $img, inLanguage => $lang,
                   datePublished => $PUBLISHED, dateModified => $PUBLISHED, mainEntityOfPage => $canon,
                   author => { '@id' => "$SITE/#org" }, publisher => { '@id' => "$SITE/#org" } };
  }
  my $ld = '<script type="application/ld+json">' . $json->encode({ '@context' => 'https://schema.org', '@graph' => \@graph }) . '</script>';
  $h =~ s{<script type="application/ld\+json">.*?</script>\n?}{}gs;
  $h =~ s{</head>}{$ld\n</head>};

  open my $out, '>:utf8', $file or die $!; print $out $h; close $out;
  printf "%-52s %3d  %s\n", $file, length($title), $title;
}
