<?php
/** Appearance → Customize → Linden Residences: contact details shown in the header menu, footer and contact page. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'customize_register', function ( $wp ) {
	$wp->add_section( 'linden', array( 'title' => 'Linden Residences', 'priority' => 30, 'description' => 'Contact details used across the site. The site name comes from Settings → General.' ) );
	$fields = array(
		'linden_district' => array( 'District / city', 'New Belgrade', 'sanitize_text_field' ),
		'linden_address'  => array( 'Sales office address', 'Linden Boulevard 12, New Belgrade', 'sanitize_text_field' ),
		'linden_phone'    => array( 'Phone', '+381 00 000 0000', 'sanitize_text_field' ),
		'linden_email'    => array( 'Email (also receives enquiries)', get_option( 'admin_email' ), 'sanitize_email' ),
		'linden_whatsapp' => array( 'WhatsApp number (digits only, with country code)', '', 'sanitize_text_field' ),
	);
	foreach ( $fields as $id => $f ) {
		$wp->add_setting( $id, array( 'default' => $f[1], 'sanitize_callback' => $f[2] ) );
		$wp->add_control( $id, array( 'label' => $f[0], 'section' => 'linden', 'type' => 'linden_email' === $id ? 'email' : 'text' ) );
	}
} );
