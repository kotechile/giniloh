<?php
/*
Plugin Name: Coolify Frontend Redeploy Trigger
Description: Rebuilds every front end when content changes. Deliberately knows NOTHING about which
             vertical or article belongs to which site.
Version: 5.0
Author: Jorge Fernandez
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ================================================================================================
 * DESIGN: WHY THIS PLUGIN HAS NO CONTENT KNOWLEDGE
 *
 * An earlier version resolved each post's `vertical` term to a site_domain and rebuilt only that
 * property. It was precise, and it was the most dangerous thing in the system.
 *
 * The mapping lived in THIS FILE as a hand-generated array of 31 verticals. That is a copy of
 * Supabase's `vertical_sites`, and the two drift in a direction that fails SILENTLY:
 *
 *     add a vertical to Supabase        -> unknown here -> we rebuilt everything -> correct anyway
 *     MOVE a vertical to another site   -> this file still points at the OLD site -> the article
 *                                          never appears on its new home, with no error anywhere
 *
 * That second case is not hypothetical: during the 2026 split, 18 verticals moved from
 * giniloh.com to aichieve.net. With the map in place, every one of those publishes would have
 * rebuilt the wrong property.
 *
 * Rebuilding everything is ALWAYS correct. Which property a post belongs to is decided by each
 * front end, at build time, from the `vertical` on the post — not here. So this file has no
 * routing table to keep in step, no sync step to forget, and nothing that can disagree with
 * Supabase.
 *
 * Do not "optimise" this back into a per-site lookup. The redundant build is the price of having
 * no silent failure mode, and the builds are cheap (giniloh ~130s, aichieve ~11s).
 *
 * The ONE thing that must be configured here is the Coolify application list, and that is a
 * DEPLOY-TIME fact: it changes when you stand up a new property, which requires touching Coolify
 * anyway. It is not content data and does not drift.
 * ============================================================================================== */

/* ================================================================================================
 * CREDENTIALS LIVE IN wp-config.php, NOT HERE
 *
 * This file must be safe to commit. A Coolify API token is a live deploy credential; keeping it in
 * a plugin meant any copy of the file leaked it. Add to wp-config.php, above the
 * "That's all, stop editing!" line:
 *
 *     define( 'COOLIFY_API_TOKEN', '...paste the token here...' );
 *     define( 'COOLIFY_BASE_URL',  'https://coolify.giniloh.com' );   // optional, this is the default
 *
 * If the token is absent the webhook disables itself and says so in wp-admin, rather than failing
 * silently or falling back to a value baked into the repository.
 * ============================================================================================== */

function giniloh_coolify_base_url() {
	return defined( 'COOLIFY_BASE_URL' ) ? rtrim( COOLIFY_BASE_URL, '/' ) : 'https://coolify.giniloh.com';
}

function giniloh_coolify_token() {
	return defined( 'COOLIFY_API_TOKEN' ) ? COOLIFY_API_TOKEN : '';
}

/**
 * Coolify application UUIDs to rebuild on any content change.
 *
 * Contents are a deploy-time fact, NOT content data. Add a row here when you deploy a new front
 * end. Deliberately excluded:
 *
 *   apps.aichieve.net -- the PRO apps, not a content property. Content publishes must never
 *                        rebuild it.
 *
 * Note for future properties: a NEW site should get its own WordPress (separate CMS), in which
 * case it does not belong in this list at all -- its own CMS triggers its own rebuild.
 */
function giniloh_coolify_apps() {
	return array(
		'giniloh.com'   => 'c6sm5gz59a3jnrjg1ouahfp7',
		'aichieve.net'  => 'p3zkcfkzvmjq6xt3yjnsobwf',
		'wellroost.com' => 'mln99jwbwspi62huuifloxla',
	);
}

/**
 * Fire the deploy webhooks for every front end.
 *
 * BLOCKING, DELIBERATELY. The first version used `blocking => false` so the editor would never
 * wait on Coolify -- and that hid a fatal problem for its whole life: the API token was scoped to
 * `read` only, so every request came back 403 and NOTHING was ever deployed, while the plugin
 * reported success. A redeploy that cannot report its own failure is worse than no redeploy.
 *
 * The deploy endpoint QUEUES a build and returns immediately, so waiting for it costs well under a
 * second -- the thing that actually takes minutes happens on Coolify's side, not in this request.
 * The result is recorded so wp-admin can show it.
 *
 * @return array{uuid:string, code:int|string}[]|false
 */
function giniloh_coolify_redeploy_all() {
	$token = giniloh_coolify_token();
	if ( ! $token ) {
		update_option( 'giniloh_coolify_last_redeploy', array(
			'time'    => time(),
			'ok'      => false,
			'message' => 'COOLIFY_API_TOKEN is not defined in wp-config.php.',
			'results' => array(),
		) );
		return false;
	}

	$base    = giniloh_coolify_base_url();
	$results = array();
	$failed  = array();

	foreach ( giniloh_coolify_apps() as $site => $uuid ) {
		$response = wp_remote_post(
			$base . '/api/v1/deploy?uuid=' . rawurlencode( $uuid ) . '&force=true',
			array(
				// Long enough for Coolify to accept and queue, short enough not to hang a save.
				'timeout'   => 10,
				'blocking'  => true,
				'sslverify' => true,
				'headers'   => array( 'Authorization' => 'Bearer ' . $token ),
			)
		);

		if ( is_wp_error( $response ) ) {
			$code = $response->get_error_message();
		} else {
			$code = (int) wp_remote_retrieve_response_code( $response );
			if ( 200 !== $code && 201 !== $code ) {
				// Coolify explains itself here, e.g. "Missing required permissions: deploy".
				$body   = wp_remote_retrieve_body( $response );
				$detail = json_decode( $body, true );
				$code   = $code . ' ' . ( is_array( $detail ) && isset( $detail['message'] ) ? $detail['message'] : substr( (string) $body, 0, 120 ) );
			}
		}

		$results[] = array( 'site' => $site, 'uuid' => $uuid, 'code' => $code );

		if ( ! is_int( $code ) || ! in_array( $code, array( 200, 201 ), true ) ) {
			$failed[] = $site;
		}
	}

	update_option( 'giniloh_coolify_last_redeploy', array(
		'time'    => time(),
		'ok'      => empty( $failed ),
		'message' => $failed ? 'Rejected for: ' . implode( ', ', $failed ) : 'All front ends queued.',
		'results' => $results,
	) );

	return $results;
}

/**
 * Show the last redeploy attempt in wp-admin. Silent success is fine; silent FAILURE is not.
 */
add_action( 'admin_notices', function () {
	$last = get_option( 'giniloh_coolify_last_redeploy' );
	if ( ! $last || ! empty( $last['ok'] ) ) {
		return;   // nothing yet, or it worked
	}
	if ( ! function_exists( 'get_current_screen' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || 'edit-post' !== $screen->base ) {
		return;
	}

	echo '<div class="notice notice-error"><p><strong>Front-end redeploy FAILED.</strong> '
		. esc_html( $last['message'] ) . ' <em>(' . esc_html( human_time_diff( $last['time'] ) ) . ' ago)</em></p>';
	if ( ! empty( $last['results'] ) ) {
		echo '<ul style="margin-left:1.2em;list-style:disc">';
		foreach ( $last['results'] as $r ) {
			echo '<li><code>' . esc_html( $r['site'] ) . '</code> &rarr; ' . esc_html( (string) $r['code'] ) . '</li>';
		}
		echo '</ul>';
	}
	echo '<p>A 403 usually means the Coolify API token is missing the <code>deploy</code> permission.</p></div>';
} );

/* -- triggers ------------------------------------------------------------------------------------
 * Entering publish: the new article has to appear somewhere.
 * Leaving publish (draft, pending, private, trash): the live page has to disappear.
 * Same action both ways -- we do not know WHICH site showed it, and guessing wrong is worse than
 * rebuilding a site that did not need it.
 */
function giniloh_coolify_on_transition( $new_status, $old_status, $post ) {
	$entering = ( 'publish' === $new_status && 'publish' !== $old_status );
	$leaving  = ( 'publish' === $old_status && 'publish' !== $new_status );

	if ( ! $entering && ! $leaving ) {
		return;
	}
	if ( ! in_array( $post->post_type, array( 'post', 'page' ), true ) ) {
		return;
	}

	giniloh_coolify_redeploy_all();
}
add_action( 'transition_post_status', 'giniloh_coolify_on_transition', 10, 3 );

/* -- surface a missing credential instead of failing quietly ------------------------------------- */

add_action( 'admin_notices', function () {
	if ( giniloh_coolify_token() ) {
		return;
	}
	if ( ! function_exists( 'get_current_screen' ) ) {
		return;
	}
	$screen = get_current_screen();
	if ( ! $screen || 'edit-post' !== $screen->base ) {
		return;
	}
	echo '<div class="notice notice-error"><p><strong>Front-end redeploys are DISABLED.</strong> '
		. '<code>COOLIFY_API_TOKEN</code> is not defined. Publishing or unpublishing a post will not '
		. 'rebuild any site until you add it to <code>wp-config.php</code>.</p></div>';
} );

/* -- manual trigger from the admin bar ----------------------------------------------------------- */

add_action( 'admin_bar_menu', function ( $bar ) {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$bar->add_node( array(
		'id'    => 'giniloh-redeploy',
		'title' => 'Rebuild all front ends',
		'href'  => wp_nonce_url( admin_url( 'admin-post.php?action=giniloh_redeploy_all' ), 'giniloh_redeploy_all' ),
	) );
}, 999 );

add_action( 'admin_post_giniloh_redeploy_all', function () {
	if ( ! current_user_can( 'manage_options' ) || ! check_admin_referer( 'giniloh_redeploy_all' ) ) {
		wp_die( 'Not allowed.' );
	}
	$n = giniloh_coolify_redeploy_all();
	wp_safe_redirect( add_query_arg( array( 'giniloh_redeployed' => $n ), wp_get_referer() ?: admin_url() ) );
	exit;
} );
