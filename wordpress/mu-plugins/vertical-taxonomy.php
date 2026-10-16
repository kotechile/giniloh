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
 * REST API, a checkbox UI in the editor, and a controlled vocabulary. Post meta gives the first only
 * if you also register it for REST by hand.
 *
 * WHY NOT `post_tag`
 * `post_tag` was empty on all 118 posts and is already exposed as `tags`, so it would have worked
 * with zero PHP. But routing must not be able to break because someone invented a tag for an
 * unrelated reason. A closed vocabulary is the point.
 *
 * DEPLOY: wp-content/mu-plugins/ (mu-plugins load automatically, need no activation, and survive
 * theme changes). If the site cannot take mu-plugins, paste the register_taxonomy() call into the
 * child theme's functions.php — but then a theme switch silently drops routing.
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
			'rewrite'           => false,         // never a public URL
		)
	);
} );

/**
 * Keep the routing vocabulary closed.
 *
 * Without this, any editor can invent a vertical. A brand-new vertical has no row in
 * vertical_sites, so it maps to no site — the post would route nowhere and vanish from every front
 * end. Restricting creation to admins keeps the term list a deliberate decision.
 *
 * Scoped to `is_user_logged_in()` on purpose: in a CLI run there is no current user, and an
 * unscoped current_user_can() returns false, which would make this filter reject the backfill's own
 * wp_insert_term() calls and create no terms at all.
 */
add_filter( 'pre_insert_term', function ( $term, $taxonomy ) {
	if ( 'vertical' === $taxonomy && is_user_logged_in() && ! current_user_can( 'manage_options' ) ) {
		return new WP_Error(
			'vertical_locked',
			'Verticals define which site owns a post. Ask an administrator to add one.'
		);
	}
	return $term;
}, 10, 2 );

/**
 * ================================================================================================
 * REQUIRE A VERTICAL BEFORE A POST CAN BE PUBLISHED
 * ================================================================================================
 *
 * A post with no vertical resolves to no property and publishes to NO site — silently. No error, no
 * 404; it simply is not on any front end. That is the bug that left 6 posts invisible before the
 * backfill, and the reason this is enforced rather than merely allowed.
 *
 * ------------------------------------------------------------------------------------------------
 * WHY THIS FILTERS *BEFORE* THE WRITE
 *
 * The obvious place to enforce this is `save_post` — let it publish, then bounce it back to draft.
 * That is wrong here. giniloh-coolify-redeploy.php hooks `transition_post_status` and fires a
 * Coolify rebuild whenever a post transitions INTO publish. Bouncing afterwards would mean:
 *
 *     draft -> publish   (rebuild fires — building the post onto a site it does not belong to!)
 *             -> draft   (unpublish hook fires — a SECOND rebuild)
 *
 * The post would briefly reach the sites, then cost two full rebuilds to remove. Filtering
 * `wp_insert_post_data` changes the status BEFORE it is written: no publish transition ever
 * happens, so no rebuild is triggered and there is no window where the post is live.
 *
 * ------------------------------------------------------------------------------------------------
 * WHY THERE IS NO CATEGORY-BASED DEFAULT
 *
 * I measured this against the live corpus before building it, and it does not hold. Categories are
 * broad (8), verticals are narrow (27), so a category does NOT determine a vertical:
 *
 *     supply-chain-operations     32 posts across 7 verticals   (top: 6/32 = 19%)
 *     ai-stack-tool-tco           22 posts across 6 verticals   (top: 5/22 = 23%)
 *     major-purchases-assets      14 posts across 5 verticals   (top: 5/14 = 36%)
 *     career-ai-resilience         3 posts, 1 vertical          (3/3  — the only clean one)
 *
 * A default would be wrong 64-81% of the time, and a plausible-looking wrong value is worse than an
 * empty one: the writer will not stop to correct a field that already has an answer in it.
 *
 * ------------------------------------------------------------------------------------------------
 * PIPELINE WARNING
 *
 * This blocks ANY publish, including programmatic ones over the REST API. If a sync job pushes
 * articles into WordPress, it must set `vertical` too, or every post it publishes will be held as a
 * draft. Either make the sync set the vertical (preferred), or scope this to human edits:
 *
 *     add_filter( 'vertical_require_on_publish', fn() => is_admin() );
 *
 * or disable it outright:
 *
 *     add_filter( 'vertical_require_on_publish', '__return_false' );
 */
add_filter( 'wp_insert_post_data', function ( $data, $postarr ) {

	if ( ! isset( $data['post_type'] ) || 'post' !== $data['post_type'] ) {
		return $data;
	}
	if ( ! isset( $data['post_status'] ) || 'publish' !== $data['post_status'] ) {
		return $data;
	}

	$post_id = isset( $postarr['ID'] ) ? (int) $postarr['ID'] : 0;

	// Already published? This is an EDIT, not a transition. Never unpublish a live post just
	// because a given save did not re-submit the taxonomy box.
	if ( $post_id && 'publish' === get_post_status( $post_id ) ) {
		return $data;
	}

	// Look for a vertical in every shape a caller might send one.
	$candidates = array();
	foreach ( array( 'tax_input', 'vertical' ) as $key ) {
		if ( ! empty( $postarr[ $key ] ) ) {
			$candidates[] = $postarr[ $key ];
		}
	}
	// phpcs:disable WordPress.Security.NonceVerification -- not an action, just reading a value
	if ( ! empty( $_POST['tax_input']['vertical'] ) ) {
		$candidates[] = wp_unslash( $_POST['tax_input']['vertical'] );
	}
	if ( ! empty( $_POST['vertical'] ) ) {
		$candidates[] = wp_unslash( $_POST['vertical'] );
	}
	// phpcs:enable WordPress.Security.NonceVerification

	$has_vertical = false;
	foreach ( $candidates as $cand ) {
		if ( is_array( $cand ) && isset( $cand['vertical'] ) ) {
			$cand = $cand['vertical'];
		}
		$cand = array_filter( (array) $cand, function ( $v ) {
			return '' !== $v && '0' !== $v && 0 !== $v && null !== $v;
		} );
		if ( $cand ) {
			$has_vertical = true;
			break;
		}
	}

	// Fall back to terms already attached, for callers that assign the taxonomy separately.
	if ( ! $has_vertical && $post_id && has_term( '', 'vertical', $post_id ) ) {
		$has_vertical = true;
	}

	if ( $has_vertical ) {
		return $data;
	}

	if ( ! apply_filters( 'vertical_require_on_publish', true, $post_id, $data ) ) {
		return $data;
	}

	// Hold it as a draft. It never reaches 'publish', so no site rebuild is triggered.
	$data['post_status'] = 'draft';

	// Flag it for the editor. A brand-new post has NO ID yet at this point (the insert has not
	// happened), so key the "new post" case to the USER, not the literal string 'new' — otherwise
	// two editors publishing at once would share one flag and one of them would see nothing.
	set_transient( vertical_missing_key( $post_id ), 1, 300 );

	return $data;
}, 10, 2 );

/**
 * Transient key for "this publish attempt was held".
 *
 * Prefixed and user-scoped for new posts, because wp_insert_post_data runs before the row exists.
 */
function vertical_missing_key( $post_id = 0 ) {
	return $post_id
		? 'vertical_missing_' . (int) $post_id
		: 'vertical_missing_u' . get_current_user_id();
}

/**
 * Explain the hold. Silent failure is what we are fixing, so this must be loud.
 */
add_action( 'admin_notices', function () {

	if ( ! function_exists( 'get_current_screen' ) ) {
		return;
	}
	$screen = get_current_screen();
	$post_id = isset( $_GET['post'] ) ? (int) $_GET['post'] : 0; // phpcs:ignore WordPress.Security.NonceVerification

	$is_editor = $screen && 'post' === $screen->base && $post_id;
	$user_key  = vertical_missing_key( 0 );

	$missing = ( $is_editor && get_transient( vertical_missing_key( $post_id ) ) )
		|| get_transient( $user_key );

	if ( ! $missing ) {
		return;
	}

	if ( $is_editor ) {
		delete_transient( vertical_missing_key( $post_id ) );
	}
	delete_transient( $user_key );

	echo '<div class="notice notice-error"><p><strong>Held as a draft — no Vertical selected.</strong> '
		. 'Every post needs a <em>Vertical</em>: it decides which site the article belongs to, and a '
		. 'post without one appears on <strong>no site at all</strong>. '
		. 'Pick one in the <strong>Verticals</strong> box, then publish again.</p></div>';
} );

/**
 * Surface the number of published posts with no vertical, so a silent gap cannot accumulate.
 */
add_action( 'admin_notices', function () {

	if ( ! function_exists( 'get_current_screen' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || 'edit-post' !== $screen->base ) {
		return;
	}

	$untagged = get_posts( array(
		'post_type'   => 'post',
		'post_status' => 'publish',
		'numberposts' => -1,
		'fields'      => 'ids',
		'tax_query'   => array(
			array(
				'taxonomy' => 'vertical',
				'operator' => 'NOT EXISTS',
			),
		),
	) );

	if ( ! $untagged ) {
		return;
	}

	printf(
		'<div class="notice notice-warning"><p><strong>%d published post(s) have no Vertical.</strong> '
		. 'They will not appear on any site.</p></div>',
		count( $untagged )
	);
} );
