<?php
/** Forms: every enquiry, viewing request and newsletter sign-up is emailed and kept under Properties → Enquiries. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'init', function () {
	register_post_type( 'linden_enquiry', array(
		'labels'       => array( 'name' => 'Enquiries', 'singular_name' => 'Enquiry', 'all_items' => 'Enquiries', 'edit_item' => 'Enquiry' ),
		'public'       => false,
		'show_ui'      => true,
		'show_in_menu' => 'edit.php?post_type=linden_property',
		'capabilities' => array( 'create_posts' => 'do_not_allow' ),
		'map_meta_cap' => true,
		'supports'     => array( 'title', 'editor' ),
	) );
} );

function linden_handle_enquiry() {
	if ( ! check_ajax_referer( 'linden_enquiry', 'nonce', false ) ) {
		wp_send_json_error( 'expired', 403 );
	}
	$skip  = array( 'action', 'nonce' );
	$lines = array();
	$name  = '';
	foreach ( $_POST as $k => $v ) {
		$k = sanitize_key( $k );
		if ( in_array( $k, $skip, true ) || is_array( $v ) ) {
			continue;
		}
		$v = 'msg' === $k ? sanitize_textarea_field( wp_unslash( $v ) ) : sanitize_text_field( wp_unslash( $v ) );
		if ( '' === $v ) {
			continue;
		}
		if ( in_array( $k, array( 'name', 'first' ), true ) ) {
			$name = $v;
		}
		$lines[] = ucfirst( str_replace( '_', ' ', $k ) ) . ': ' . $v;
	}
	if ( ! $lines ) {
		wp_send_json_error( 'empty', 400 );
	}
	$kind  = isset( $_POST['kind'] ) && 'newsletter' === $_POST['kind'] ? 'Newsletter sign-up' : 'Website enquiry';
	$title = $kind . ( $name ? ' — ' . $name : '' );
	$body  = implode( "\n", $lines );
	wp_insert_post( array( 'post_type' => 'linden_enquiry', 'post_status' => 'private', 'post_title' => $title, 'post_content' => $body ) );
	$to = get_theme_mod( 'linden_email', get_option( 'admin_email' ) );
	wp_mail( $to, '[' . get_bloginfo( 'name' ) . '] ' . $title, $body );
	wp_send_json_success();
}
add_action( 'wp_ajax_linden_enquiry', 'linden_handle_enquiry' );
add_action( 'wp_ajax_nopriv_linden_enquiry', 'linden_handle_enquiry' );
