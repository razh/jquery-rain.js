/*
 *  Project: jquery-rain.js
 *  Description: jQuery plugin for making it rain.
 *  Author: Raymond Zhou
 *  License: MIT
 */

;(function ( $, window, document, undefined ) {
  'use strict';

  var pluginName = 'rain',
    defaults = {
      gravity: 10,
      // Number of rain drops per second.
      rate: 200,
      wind: {
        x: 0,
        y: 0
      }
    };

  function Rain( element, options ) {
    this.element = element;

    this.options = $.extend( {}, defaults, options );

    this._defaults = defaults;
    this._name = pluginName;

    this.init();

    this.canvas = null;
    this.ctx = null;
  }

  Rain.prototype = {

    init: function() {
      var $el = $( this.element );

      this.canvas = $el.append( '<canvas></canvas>' )[0];
      this.ctx    = this.canvas.getContext( '2d' );
    }
  };

  $.fn[ pluginName ] = function( options ) {
    return this.each(function() {
      if ( !$.data( this, 'plugin_' + pluginName ) ) {
        $.data( this, 'plugin_' + pluginName, new Rain( this, options ) );
      }
    });
  };

})( jQuery, window, document );
