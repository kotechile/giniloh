<?php
/**
 * Plugin Name: Vertical Routing Taxonomy
 * Description: A `vertical` taxonomy marking which property (giniloh.com, aichieve.net, wellroost.com)
 *              owns a post. Mirrors supabase.vertical_sites.
 *
 * ------------------------------------------------------------------------------------------------
 * WHY A TAXONOMY AND NOT POST META
 * Routing has to be filterable server-side by the front ends, authorable by whoever writes the post,
 * and impossible to typo. A taxonomy gives all three: native `?vertical=<slug>` filtering in the WP
 * REST API, a checkbox UI in the editor, and a controlled vocabulary (authors pick from terms rather
 * than inventing a string). Post meta gives the first only if you also register it for REST by hand.
 *
 * WHY NOT `post_tag`
 * `post_tag` is empty on all 118 posts and already exposed as `tags`, so it would work with zero PHP.
 * But routing must not be able to break because someone invented a tag for an unrelated reason.
 * Keeping the vocabulary closed is the point.
 *
 * DEPLOY: drop into wp-content/mu-plugins/ (mu-plugins load automatically, no activation, and
 * survive theme changes). If the site cannot take mu-plugins, paste the register_taxonomy() call
 * into the child theme's functions.php instead — but then a theme switch silently drops routing.
 *
 * AFTER DEPLOYING: flush permalinks (wp rewrite flush, or Settings > Permalinks > Save) so the
 * REST routes register.
 *
 * Docs: https://developer.wordpress.org/reference/functions/register_taxonomy/
 */

add_action( 'init', function () {

	register_taxonomy(
		'vertical',
		array( 'post' ),
		array(
			'labels'            => array(
				'name'          => 'Verticals',
				'singular_name' => 'Vertical',
				'menu_name'     => 'Verticals',
			),

			// -- the load-bearing line ------------------------------------------------
			// Without this the taxonomy is invisible to the REST API, and the front ends
			// cannot filter by it. Everything else here is ergonomics.
			'show_in_rest'      => true,
			'rest_base'         => 'vertical',

			'public'            => true,
			'show_ui'           => true,          // visible in the editor + admin
			'show_in_menu'      => true,
			'show_in_nav_menus' => false,         // routing metadata, not navigation
			'show_admin_column' => true,          // a Vertical column in the posts list

			// Flat: a vertical is a property/area label, not a hierarchy. The WP *category*
			// keeps the site's information architecture; this marks ownership.
			'hierarchical'      => false,

			'query_var'         => true,
			'rewrite'           => false,         // never a public URL; posts live at their own slug
		)
	);
} );

/**
 * Optional guard: block verticals being created by anyone but an admin, so the routing vocabulary
 * cannot drift. Remove if it gets in the way.
 */
add_filter( 'pre_insert_term', function ( $term, $taxonomy ) {
	if ( 'vertical' === $taxonomy && ! current_user_can( 'manage_options' ) ) {
		return new WP_Error(
			'vertical_locked',
			'Verticals define which site owns a post. Ask an administrator to add one.'
		);
	}
	return $term;
}, 10, 2 );
