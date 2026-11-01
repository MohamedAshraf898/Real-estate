<?php
/** Properties: a dashboard list of units with price, size, status and photos. */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function linden_property_fields() {
	return array(
		'code'    => array( 'Unit code', 'text', 'e.g. a-0712 (used in the page address)' ),
		'type'    => array( 'Type', 'select', array( 'Apartment', 'Penthouse', 'Office', 'Retail' ) ),
		'status'  => array( 'Status', 'select', array( 'Available', 'New', 'Reserved', 'Sold' ) ),
		'wing'    => array( 'Building wing', 'select', array( 'A', 'B', 'V' ) ),
		'floor'   => array( 'Floor', 'number', '0 = ground floor' ),
		'beds'    => array( 'Bedrooms', 'number', '0 = studio' ),
		'baths'   => array( 'Bathrooms', 'number', '' ),
		'area'    => array( 'Net area (m²)', 'number', '' ),
		'outdoor' => array( 'Terrace / balcony (m²)', 'number', '' ),
		'price'   => array( 'Price (€)', 'number', '' ),
		'orient'  => array( 'Orientation', 'text', 'e.g. South-West' ),
		'view'    => array( 'View', 'select', array( 'City', 'Park' ) ),
		'parking' => array( 'Parking included', 'checkbox', '' ),
		'storage' => array( 'Storage room', 'checkbox', '' ),
		'images'  => array( 'Photos', 'images', 'First photo = card image. Use “Add photos” or paste one image URL per line.' ),
	);
}

add_action( 'init', function () {
	register_post_type( 'linden_property', array(
		'labels'       => array(
			'name' => 'Properties', 'singular_name' => 'Property', 'add_new_item' => 'Add property', 'edit_item' => 'Edit property',
			'all_items' => 'All properties', 'menu_name' => 'Properties', 'search_items' => 'Search properties', 'not_found' => 'No properties yet',
		),
		'public'       => false,
		'show_ui'      => true,
		'show_in_rest' => true,
		'menu_icon'    => 'dashicons-building',
		'menu_position'=> 5,
		'supports'     => array( 'title', 'page-attributes' ),
	) );
} );

add_action( 'add_meta_boxes', function () {
	add_meta_box( 'linden_property_details', 'Property details', 'linden_property_box', 'linden_property', 'normal', 'high' );
} );

function linden_property_box( $post ) {
	wp_nonce_field( 'linden_property_save', 'linden_property_nonce' );
	echo '<style>.lp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px 20px}.lp-grid label{display:grid;gap:4px;font-weight:600}.lp-grid input,.lp-grid select{width:100%}.lp-full{grid-column:1/-1}.lp-help{font-weight:400;color:#777;font-size:12px}.lp-thumbs{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.lp-thumbs img{width:90px;height:68px;object-fit:cover;border-radius:4px}</style><div class="lp-grid">';
	foreach ( linden_property_fields() as $key => $f ) {
		$val  = get_post_meta( $post->ID, '_lp_' . $key, true );
		$name = 'lp_' . $key;
		if ( 'images' === $f[1] ) {
			echo '<label class="lp-full">' . esc_html( $f[0] ) . ' <span class="lp-help">' . esc_html( $f[2] ) . '</span>';
			echo '<textarea name="' . esc_attr( $name ) . '" id="lp-images" rows="4" style="width:100%">' . esc_textarea( $val ) . '</textarea></label>';
			echo '<div class="lp-full"><button type="button" class="button" id="lp-add-images">Add photos</button><div class="lp-thumbs" id="lp-thumbs"></div></div>';
			continue;
		}
		echo '<label>' . esc_html( $f[0] );
		if ( 'select' === $f[1] ) {
			echo '<select name="' . esc_attr( $name ) . '">';
			foreach ( $f[2] as $opt ) {
				echo '<option ' . selected( $val, $opt, false ) . '>' . esc_html( $opt ) . '</option>';
			}
			echo '</select>';
		} elseif ( 'checkbox' === $f[1] ) {
			echo '<span><input type="checkbox" name="' . esc_attr( $name ) . '" value="1" ' . checked( $val, '1', false ) . '> Yes</span>';
		} else {
			echo '<input type="' . esc_attr( $f[1] ) . '" name="' . esc_attr( $name ) . '" value="' . esc_attr( $val ) . '"' . ( 'number' === $f[1] ? ' min="0" step="1"' : '' ) . '>';
			if ( $f[2] ) {
				echo '<span class="lp-help">' . esc_html( $f[2] ) . '</span>';
			}
		}
		echo '</label>';
	}
	echo '</div>';
}

add_action( 'admin_enqueue_scripts', function ( $hook ) {
	$screen = get_current_screen();
	if ( ! $screen || 'linden_property' !== $screen->post_type ) {
		return;
	}
	wp_enqueue_media();
	wp_add_inline_script( 'jquery-core', <<<'JS'
jQuery(function ($) {
  var $ta = $('#lp-images'), $th = $('#lp-thumbs');
  function thumbs() { $th.empty(); $ta.val().split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (u) { $th.append($('<img>', { src: u, alt: '' })); }); }
  $ta.on('input', thumbs); thumbs();
  $('#lp-add-images').on('click', function (e) {
    e.preventDefault();
    var frame = wp.media({ title: 'Choose photos', button: { text: 'Use photos' }, multiple: true, library: { type: 'image' } });
    frame.on('select', function () {
      var urls = frame.state().get('selection').map(function (a) { a = a.toJSON(); return (a.sizes && a.sizes.large ? a.sizes.large.url : a.url); });
      $ta.val(($ta.val().trim() ? $ta.val().trim() + '\n' : '') + urls.join('\n')); thumbs();
    });
    frame.open();
  });
});
JS
	);
} );

add_action( 'save_post_linden_property', function ( $post_id ) {
	if ( ! isset( $_POST['linden_property_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['linden_property_nonce'] ) ), 'linden_property_save' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE || ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( linden_property_fields() as $key => $f ) {
		$raw = isset( $_POST[ 'lp_' . $key ] ) ? wp_unslash( $_POST[ 'lp_' . $key ] ) : '';
		if ( 'checkbox' === $f[1] ) {
			$val = $raw ? '1' : '';
		} elseif ( 'number' === $f[1] ) {
			$val = '' === $raw ? '' : (string) absint( $raw );
		} elseif ( 'images' === $f[1] ) {
			$val = implode( "\n", array_filter( array_map( 'esc_url_raw', array_map( 'trim', preg_split( '/\R+/', $raw ) ) ) ) );
		} elseif ( 'select' === $f[1] ) {
			$val = in_array( $raw, $f[2], true ) ? $raw : $f[2][0];
		} else {
			$val = sanitize_text_field( $raw );
		}
		if ( 'code' === $key && '' === $val ) {
			$val = get_post_field( 'post_name', $post_id ) ? get_post_field( 'post_name', $post_id ) : 'unit-' . $post_id;
		}
		update_post_meta( $post_id, '_lp_' . $key, $val );
	}
} );

/** Admin list columns. */
add_filter( 'manage_linden_property_posts_columns', function ( $cols ) {
	return array_slice( $cols, 0, 2, true ) + array( 'lp_code' => 'Code', 'lp_price' => 'Price', 'lp_status' => 'Status', 'lp_size' => 'Size' ) + $cols;
} );
add_action( 'manage_linden_property_posts_custom_column', function ( $col, $id ) {
	$m = function ( $k ) use ( $id ) { return get_post_meta( $id, '_lp_' . $k, true ); };
	if ( 'lp_code' === $col ) { echo esc_html( strtoupper( $m( 'code' ) ) ); }
	if ( 'lp_price' === $col ) { echo $m( 'price' ) ? '€ ' . esc_html( number_format_i18n( (int) $m( 'price' ) ) ) : '—'; }
	if ( 'lp_status' === $col ) { echo esc_html( $m( 'status' ) ); }
	if ( 'lp_size' === $col ) { echo $m( 'area' ) ? esc_html( $m( 'area' ) ) . ' m² · ' . esc_html( (int) $m( 'beds' ) ? $m( 'beds' ) . ' bed' : 'studio' ) : '—'; }
}, 10, 2 );

/** Published properties in the shape the site scripts expect (window.PROPERTIES). */
function linden_properties_data() {
	$posts = get_posts( array( 'post_type' => 'linden_property', 'post_status' => 'publish', 'numberposts' => 300, 'orderby' => array( 'menu_order' => 'ASC', 'date' => 'DESC' ) ) );
	$out   = array();
	foreach ( $posts as $p ) {
		$m      = function ( $k ) use ( $p ) { return get_post_meta( $p->ID, '_lp_' . $k, true ); };
		$images = array_values( array_filter( array_map( 'trim', preg_split( '/\R+/', (string) $m( 'images' ) ) ) ) );
		$out[]  = array(
			'id'      => $m( 'code' ) ? $m( 'code' ) : 'unit-' . $p->ID,
			'type'    => $m( 'type' ) ? $m( 'type' ) : 'Apartment',
			'title'   => get_the_title( $p ),
			'wing'    => $m( 'wing' ) ? $m( 'wing' ) : 'A',
			'floor'   => (int) $m( 'floor' ),
			'beds'    => (int) $m( 'beds' ),
			'baths'   => max( 1, (int) $m( 'baths' ) ),
			'area'    => max( 1, (int) $m( 'area' ) ),
			'outdoor' => (int) $m( 'outdoor' ),
			'price'   => (int) $m( 'price' ),
			'status'  => $m( 'status' ) ? $m( 'status' ) : 'Available',
			'orient'  => $m( 'orient' ) ? $m( 'orient' ) : '—',
			'view'    => $m( 'view' ) ? $m( 'view' ) : 'City',
			'parking' => '1' === $m( 'parking' ),
			'storage' => '1' === $m( 'storage' ),
			'images'  => $images ? $images : array( 'living1', 'kitchen1', 'bed1', 'floorplan' ),
		);
	}
	return $out;
}
