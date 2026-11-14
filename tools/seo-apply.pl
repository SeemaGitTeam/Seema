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
    name => 'Seema', alternateName => ['سيمة', 'Seema Qatar', 'Seema Doha'],
    legalName => 'Seema for Consultations, Digital Services and Website Design',
    url => "$SITE/", email => 'hello@seema.qa', telephone => '+974 6634 5802',
    logo => { '@type' => 'ImageObject', url => "$SITE/assets/brand/fav/icon-512.png", width => 512, height => 512 },
    image => "$SITE/assets/img/hero-souq-night.jpg",
    description => 'Seema is a branding, website, mobile app and ERP company in Doha, Qatar. It helps businesses in Qatar and the Gulf grow with a stronger brand, a better digital experience and smarter systems, in Arabic and English.',
    foundingDate => '2026', slogan => 'The mark that makes the difference.',
    foundingLocation => { '@type' => 'Place', name => 'Doha, Qatar' },
    address => { '@type' => 'PostalAddress', streetAddress => '7th Floor, Al Gassar Tower, West Bay',
                 addressLocality => 'Doha', addressCountry => 'QA' },
    openingHoursSpecification => [{ '@type' => 'OpeningHoursSpecification',
      dayOfWeek => [qw(Sunday Monday Tuesday Wednesday Thursday)], opens => '08:00', closes => '17:00' }],
    knowsLanguage => ['en', 'ar'],
    knowsAbout => ['Brand strategy', 'Visual identity', 'Website development', 'Mobile app development', 'ERP', 'CRM',
                   'WPS payroll', 'RFID asset tracking', 'Digital marketing', 'SEO', 'IT support'],
    makesOffer => [
      (map { { '@type' => 'Offer', itemOffered => { '@type' => 'Service', name => $_->[0], url => "$SITE/$_->[1]" } } }
        ['Brand Strategy and Consulting', 'service-consultations.html'],
        ['Branding and Visual Identity', 'service-branding.html'],
        ['Website Design and Development', 'service-websites.html'],
        ['Mobile App Development (iOS and Android)', 'service-mobile.html'],
        ['ERP, CRM, and Business Systems', 'service-business-apps.html'],
        ['Digital Marketing, SEO, and Social Media', 'service-marketing.html'],
        ['IT Help Desk and Support', 'service-support.html']),
      { '@type' => 'Offer', itemOffered => { '@type' => 'SoftwareApplication', name => 'Seema One',
        applicationCategory => 'BusinessApplication', operatingSystem => 'Web',
        description => 'Business platform built for Qatar: HR, WPS payroll, finance, sales, procurement, supply chain, projects, customer service and IT in one system.' } },
    ],
    # sameAs => [...]  add Google Business Profile / LinkedIn / Instagram URLs once the accounts exist
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
  # FAQPage built from the visible <details> FAQ, so structured data always matches the page text
  if ($h =~ m{<div class="faq[^"]*">(.*?)</div>}s) {
    my $faq = $1; my @q;
    while ($faq =~ m{<details><summary>(.*?)</summary><p>(.*?)</p></details>}sg) {
      my ($q, $a) = ($1, $2); for ($q, $a) { s{<[^>]+>}{}g; $_ = unesc($_); }
      push @q, { '@type' => 'Question', name => $q, acceptedAnswer => { '@type' => 'Answer', text => $a } };
    }
    push @graph, { '@type' => 'FAQPage', inLanguage => $lang, mainEntity => \@q } if @q;
  }
  my $ld = '<script type="application/ld+json">' . $json->encode({ '@context' => 'https://schema.org', '@graph' => \@graph }) . '</script>';
  $h =~ s{<script type="application/ld\+json">.*?</script>\n?}{}gs;
  $h =~ s{</head>}{$ld\n</head>};

  open my $out, '>:utf8', $file or die $!; print $out $h; close $out;
  printf "%-52s %3d  %s\n", $file, length($title), $title;
}
