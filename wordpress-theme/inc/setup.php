<?php
/**
 * On activation: create the site pages (with their templates), set the home page,
 * and add the demo properties if there are none yet. Nothing that exists is overwritten.
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'after_switch_theme', function () {
	$pages = array(
		'home'       => array( 'Home', '' ),
		'properties' => array( 'Properties', 'templates/properties.php' ),
		'property'   => array( 'Property', 'templates/property.php' ),
		'project'    => array( 'The Project', 'templates/project.php' ),
		'location'   => array( 'Location', 'templates/location.php' ),
		'contact'    => array( 'Contact', 'templates/contact.php' ),
	);
	$home_id = 0;
	foreach ( $pages as $slug => $p ) {
		$existing = $p[1] ? get_pages( array( 'meta_key' => '_wp_page_template', 'meta_value' => $p[1], 'number' => 1 ) ) : array();
		if ( ! $existing ) {
			$by_slug  = get_page_by_path( $slug );
			$existing = $by_slug ? array( $by_slug ) : array();
		}
		$id = $existing ? $existing[0]->ID : wp_insert_post( array( 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p[0], 'post_name' => $slug ) );
		if ( $p[1] && $id && ! is_wp_error( $id ) ) {
			update_post_meta( $id, '_wp_page_template', $p[1] );
		}
		if ( 'home' === $slug ) {
			$home_id = $id;
		}
	}
	if ( $home_id && 'page' !== get_option( 'show_on_front' ) ) {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', $home_id );
	}

	if ( ! get_posts( array( 'post_type' => 'linden_property', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids' ) ) ) {
		foreach ( linden_demo_properties() as $i => $d ) {
			$id = wp_insert_post( array( 'post_type' => 'linden_property', 'post_status' => 'publish', 'post_title' => $d['title'], 'menu_order' => $i ) );
			if ( ! $id || is_wp_error( $id ) ) {
				continue;
			}
			foreach ( $d as $k => $v ) {
				if ( 'title' === $k ) {
					continue;
				}
				if ( 'id' === $k ) {
					$k = 'code';
				}
				if ( is_bool( $v ) ) {
					$v = $v ? '1' : '';
				}
				if ( is_array( $v ) ) {
					$v = implode( "\n", $v );
				}
				update_post_meta( $id, '_lp_' . $k, (string) $v );
			}
		}
	}
	flush_rewrite_rules();
	set_transient( 'linden_activated', 1, 60 );
} );

add_action( 'admin_notices', function () {
	if ( ! get_transient( 'linden_activated' ) ) {
		return;
	}
	delete_transient( 'linden_activated' );
	echo '<div class="notice notice-success is-dismissible"><p><strong>Linden Residences is ready.</strong> Pages and demo properties were created. Edit units under <a href="' . esc_url( admin_url( 'edit.php?post_type=linden_property' ) ) . '">Properties</a>, contact details under <a href="' . esc_url( admin_url( 'customize.php?autofocus[section]=linden' ) ) . '">Appearance → Customize → Linden Residences</a>.</p></div>';
} );
