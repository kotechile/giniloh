<?php
/**
 * Functional test for the vertical publish guard. Throwaway — not part of the site.
 *
 * Creates two throwaway posts, tries to publish each, asserts the outcome, deletes both.
 *
 *   php /tmp/test-vertical-guard.php
 */

require_once '/var/www/html/wp-load.php';

// CLI has no current user, and wp_insert_post() SKIPS tax_input assignment when
// current_user_can(assign_terms) is false. Without a user, TEST 2 could never pass for the right
// reason. 1 = the first admin.
wp_set_current_user( 1 );

$fail = 0;
$made = array();

function check( $label, $got, $want ) {
	global $fail;
	$ok = ( $got === $want );
	if ( ! $ok ) {
		$fail++;
	}
	printf( "  %-46s got=%-9s want=%-9s %s\n", $label, $got, $want, $ok ? 'PASS' : 'FAIL' );
}

echo "vertical taxonomy registered: " . ( taxonomy_exists( 'vertical' ) ? 'yes' : 'NO' ) . "\n";

$term = get_term_by( 'slug', 'agentic_ai', 'vertical' );
if ( ! $term ) {
	echo "FATAL: term 'agentic_ai' not found — run the backfill first\n";
	exit( 1 );
}
echo "test term: {$term->slug} (id {$term->term_id})\n\n";

echo "TEST 1 — publish a post with NO vertical\n";
$id1 = wp_insert_post( array(
	'post_title'   => '__guard_test_no_vertical',
	'post_content' => 'throwaway',
	'post_type'    => 'post',
	'post_status'  => 'publish',
) );
$made[] = $id1;
check( 'status after publish attempt', get_post_status( $id1 ), 'draft' );
check( 'has no vertical', (bool) wp_get_object_terms( $id1, 'vertical', array( 'fields' => 'ids' ) ) ? 'yes' : 'no', 'no' );
check( 'transient set for the notice', (bool) get_transient( vertical_missing_key( 0 ) ) ? 'yes' : 'no', 'yes' );

echo "\nTEST 2 — publish a post WITH a vertical\n";
$id2 = wp_insert_post( array(
	'post_title'   => '__guard_test_with_vertical',
	'post_content' => 'throwaway',
	'post_type'    => 'post',
	'post_status'  => 'publish',
	'tax_input'    => array( 'vertical' => array( $term->slug ) ),
) );
$made[] = $id2;
check( 'status after publish attempt', get_post_status( $id2 ), 'publish' );
check( 'vertical got assigned', (bool) wp_get_object_terms( $id2, 'vertical', array( 'fields' => 'ids' ) ) ? 'yes' : 'no', 'yes' );

echo "\nTEST 3 — editing an ALREADY PUBLISHED post must not unpublish it\n";
$r = wp_update_post( array( 'ID' => $id2, 'post_title' => '__guard_test_with_vertical (edited)' ), true );
check( 'still published after edit', get_post_status( $id2 ), 'publish' );

echo "\nTEST 4 — the guard must be disableable\n";
add_filter( 'vertical_require_on_publish', '__return_false' );
$id3 = wp_insert_post( array(
	'post_title'   => '__guard_test_filter_off',
	'post_content' => 'throwaway',
	'post_type'    => 'post',
	'post_status'  => 'publish',
) );
$made[] = $id3;
check( 'publishes when filter returns false', get_post_status( $id3 ), 'publish' );

echo "\ncleanup\n";
foreach ( $made as $i ) {
	if ( $i && ! is_wp_error( $i ) ) {
		wp_delete_post( $i, true );
		echo "  deleted {$i}\n";
	}
}

echo "\n" . ( $fail ? "RESULT: {$fail} FAILURE(S)\n" : "RESULT: ALL PASS\n" );
exit( $fail ? 1 : 0 );
