<?php


namespace greenlightaddon\Blocks;
defined('ABSPATH') OR exit;


class Renderbox{

	public function __construct(){
		add_action('init', array( $this, 'init_handler' ));
	}

	public function init_handler(){
		register_block_type(__DIR__, array(
			'render_callback' => array( $this, 'render_block' ),
		)
		);
	}

	public function render_block($settings, $inner_content, $block)
	{
		$block = (is_array($block)) ? $block : $block->parsed_block;
		$html = $inner_content;

		// Support for Hide on Frontend option
		if(!empty($block['attrs']['styleAttributes']['hideOnFrontend_Extra'])){
			if(!is_admin()){
				return '';
			}
		}

		//Polyfills
		if(!empty($block['attrs']['styleAttributes']['animationTimeline'])){
			wp_enqueue_script('scroll-view-polyfill');
		}
		if(!empty($block['attrs']['styleAttributes']['anchorName'])){
			wp_enqueue_script('anchor-polyfill');
		}

		if(!empty($block['attrs']['textContent'])){
			if(strpos($block['attrs']['textContent'], '{{') !== false){
				//Apply dynamic placeholders to text content
				$html = gl_dynamic_placeholders($html);
			}
		}

		return $html;
	}
}

new Renderbox;