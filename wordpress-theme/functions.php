<?php
/**
 * Linden Residences theme.
 * The front end is the same HTML/CSS/JS as the static site; WordPress adds page addresses,
 * editable properties (Properties in the dashboard), contact details and form emails.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'LINDEN_VER', '1.0.0' );

require get_theme_file_path( 'inc/properties.php' );
require get_theme_file_path( 'inc/customizer.php' );
require get_theme_file_path( 'inc/enquiry.php' );
require get_theme_file_path( 'inc/setup.php' );

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'script', 'style', 'gallery', 'caption' ) );
} );

/** Page keys → template files. */
function linden_templates() {
	return array(
		'properties' => 'templates/properties.php',
		'property'   => 'templates/property.php',
		'project'    => 'templates/project.php',
		'location'   => 'templates/location.php',
		'contact'    => 'templates/contact.php',
	);
}

/** Address of a site page by key (home, properties, property, project, location, contact). */
function linden_url( $key ) {
	static $cache = array();
	if ( isset( $cache[ $key ] ) ) {
		return $cache[ $key ];
	}
	if ( 'home' === $key ) {
		return $cache[ $key ] = home_url( '/' );
	}
	$tpl   = linden_templates();
	$pages = isset( $tpl[ $key ] ) ? get_pages( array( 'meta_key' => '_wp_page_template', 'meta_value' => $tpl[ $key ], 'number' => 1 ) ) : array();
	return $cache[ $key ] = $pages ? get_permalink( $pages[0] ) : home_url( '/' . $key . '/' );
}

/** Address with an optional query ("beds=2") and hash; works with plain and pretty permalinks. */
function linden_link( $key, $query = '', $hash = '' ) {
	$u = linden_url( $key );
	if ( $query ) {
		parse_str( $query, $args );
		$u = add_query_arg( $args, $u );
	}
	return $u . ( $hash ? '#' . $hash : '' );
}

add_action( 'wp_enqueue_scripts', function () {
	$a = get_theme_file_uri( 'assets/' );
	wp_enqueue_style( 'linden-tokens', $a . 'tokens.css', array(), LINDEN_VER );
	wp_enqueue_style( 'linden-site', $a . 'site.css', array( 'linden-tokens' ), LINDEN_VER );
	wp_enqueue_style( 'linden-theme', get_stylesheet_uri(), array( 'linden-site' ), LINDEN_VER );

	wp_enqueue_script( 'linden-gsap', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', array(), '3.12.5', true );
	wp_enqueue_script( 'linden-gsap-st', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', array( 'linden-gsap' ), '3.12.5', true );
	wp_enqueue_script( 'linden-lenis', 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js', array(), '1.1.13', true );
	wp_enqueue_script( 'linden-motion', $a . 'motion.js', array( 'linden-gsap-st' ), LINDEN_VER, true );
	wp_enqueue_script( 'linden-motion-plus', $a . 'motion-plus.js', array( 'linden-motion', 'linden-lenis' ), LINDEN_VER, true );
	wp_enqueue_script( 'linden-data', $a . 'data.js', array(), LINDEN_VER, true );
	wp_add_inline_script( 'linden-data', linden_inline_data(), 'after' );
	wp_enqueue_script( 'linden-main', $a . 'main.js', array( 'linden-data', 'linden-motion-plus' ), LINDEN_VER, true );
} );

/** Page addresses, contact details and the properties from the dashboard, handed to the scripts. */
function linden_inline_data() {
	$urls = array( 'ajax' => admin_url( 'admin-ajax.php' ), 'nonce' => wp_create_nonce( 'linden_enquiry' ), 'home' => linden_url( 'home' ) );
	foreach ( array_keys( linden_templates() ) as $k ) {
		$urls[ $k ] = linden_url( $k );
	}
	$brand = array(
		'name'    => get_bloginfo( 'name' ),
		'address' => get_theme_mod( 'linden_address', 'Linden Boulevard 12, New Belgrade' ),
		'phone'   => get_theme_mod( 'linden_phone', '+381 00 000 0000' ),
		'email'   => get_theme_mod( 'linden_email', get_option( 'admin_email' ) ),
		'district'=> get_theme_mod( 'linden_district', 'New Belgrade' ),
	);
	$props = linden_properties_data();
	$js    = 'window.SITE_URLS = ' . wp_json_encode( $urls ) . ';';
	$js   .= 'window.BRAND = Object.assign(window.BRAND || {}, ' . wp_json_encode( $brand ) . ');';
	if ( $props ) {
		$js .= 'window.PROPERTIES = ' . wp_json_encode( $props ) . ';';
	}
	return $js;
}

/** Three.js and the 3D building only on the home page. */
add_action( 'wp_head', function () {
	if ( is_front_page() ) {
		echo '<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>' . "\n";
	}
	if ( ! defined( 'WPSEO_VERSION' ) && ! defined( 'RANK_MATH_VERSION' ) ) {
		$desc = get_bloginfo( 'description' );
		if ( $desc ) {
			echo '<meta name="description" content="' . esc_attr( $desc ) . '">' . "\n";
		}
		echo '<meta property="og:title" content="' . esc_attr( wp_get_document_title() ) . '">' . "\n";
		echo '<meta property="og:image" content="https://images.unsplash.com/photo-1624204386084-dd8c05e32226?w=1200&h=630&q=80&fm=jpg&fit=crop">' . "\n";
		echo '<meta name="twitter:card" content="summary_large_image">' . "\n";
	}
}, 1 );
add_action( 'wp_footer', function () {
	if ( is_front_page() ) {
		echo '<script type="module" src="' . esc_url( get_theme_file_uri( 'assets/building3d.js' ) . '?ver=' . LINDEN_VER ) . '"></script>' . "\n";
	}
}, 30 );
