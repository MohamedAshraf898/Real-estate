<?php
/** Fallback for any other view (posts, archives). */
if ( ! defined( 'ABSPATH' ) ) { exit; }
$GLOBALS['linden_page'] = 'page';
get_header();
?>
<main class="page-top">
  <div class="wrap section" style="padding-top:24px">
    <?php while ( have_posts() ) : the_post(); ?>
      <div class="section-head"><span class="eyebrow"><?php bloginfo( 'name' ); ?></span><h1 class="h1"><?php the_title(); ?></h1></div>
      <div class="wp-content lead"><?php the_content(); ?></div>
    <?php endwhile; ?>
  </div>
</main>
<?php get_footer();
