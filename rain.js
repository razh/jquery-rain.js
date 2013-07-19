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
      color: 'white',
      count: 2000,
      lineWidth: 0.3,
      scale: 1.25,
      wind: {
        x: -2,
        y: 0
      }
    };

  var PI2 = 2 * Math.PI;

    // Paul Irish's requestAnimationFrame polyfill.
    // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
  window.requestAnimFrame = (function(){
    return window.requestAnimationFrame  ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      function( callback ) {
        window.setTimeout( callback, 1000 / 60 );
      };
  }) ();

  // All the running rain objects.
  var rainObjects = [];

  var prevTime = Date.now(),
      currTime = prevTime;

  function draw() {
    currTime = Date.now();
    var dt = currTime - prevTime;
    prevTime = currTime;

    // Prevent spiraling out of control.
    if ( dt > 1e2 ) {
      dt = 1e2;
    }

    // From milliseconds to seconds.
    dt *= 1e-3;

    rainObjects.forEach(function( rainObject ) {
      rainObject.update( dt );
      rainObject.draw();
    });

    window.requestAnimFrame( draw );
  }


  function Rain( element, options ) {
    this.element = element;

    this.options = $.extend( {}, defaults, options );

    this._defaults = defaults;
    this._name = pluginName;

    this.$canvas = null;
    this.canvas = null;
    this.ctx = null;

    this.points = {
      positions: [],
      velocities: []
    };

    this.running = true;
    rainObjects.push( this );

    this.init();

    // If this is the only rain object, start drawing.
    if ( rainObjects.length === 1 ) {
      draw();
    }
  }

  Rain.prototype = {

    init: function() {
      var $el = $( this.element );

      this.$canvas = $( '<canvas></canvas>' ).appendTo( $el );
      this.canvas  = this.$canvas[0];
      this.ctx     = this.canvas.getContext( '2d' );

      // Custom CSS.
      this.$canvas.css( 'position', 'absolute' );
      this.canvas.width  = $el.width();
      this.canvas.height = $el.height();

      var i = 0;
      while ( i < this.options.count ) {
        this.points.positions.push(
          Math.floor( Math.random() * this.canvas.width  ),
          5 * Math.floor( -Math.random() * this.canvas.height )
        );
        this.points.velocities.push( 0, this.options.gravity );
        i++;
      }
    },

    update: function( dt ) {
      var i = 0,
          positions  = this.points.positions,
          velocities = this.points.velocities,
          pointCount = 0.5 * positions.length;

      var dWindX = this.options.wind.x * dt,
          dWindY = this.options.wind.y * dt;

      var dy = this.options.gravity * dt,
          xIndex, yIndex;

      while ( i < pointCount ) {
        xIndex = 2 * i;
        yIndex = 2 * i + 1;

        velocities[ xIndex ] += dWindX;
        velocities[ yIndex ] += dy + dWindY;

        positions[ xIndex ] += velocities[ xIndex ];
        positions[ yIndex ] += velocities[ yIndex ];

        if ( 0 > positions[ xIndex ] || positions[ xIndex ] > this.canvas.width ) {
          velocities[ xIndex ] = 0;

          positions[ xIndex ] = Math.floor( Math.random() * this.canvas.width  ),
          positions[ yIndex ] = 5 * Math.floor( -Math.random() * this.canvas.height );
        }

        if ( positions[ yIndex ] > this.canvas.height ) {
          velocities[ xIndex ] = 0;
          velocities[ yIndex ] = 0;

          positions[ xIndex ] = Math.floor( Math.random() * this.canvas.width );
          positions[ yIndex ] = 3 * Math.floor( -Math.random() * this.canvas.height );
        }

        i++;
      }
    },

    draw: function() {
      this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );

      var i = 0,
          scale      = this.options.scale,
          positions  = this.points.positions,
          velocities = this.points.velocities,
          pointCount = 0.5 * positions.length;

      var xIndex, yIndex,
          x, y, vx, vy;

      this.ctx.beginPath();
      while ( i < pointCount ) {
        xIndex = 2 * i;
        yIndex = 2 * i + 1;

        x = positions[ xIndex ];
        y = positions[ yIndex ];

        vx = velocities[ xIndex ] * scale;
        vy = velocities[ yIndex ] * scale;

        this.ctx.moveTo( x, y );
        this.ctx.lineTo( x + vx, y + vy );

        i++;
      }

      this.ctx.strokeStyle = this.options.color;
      this.ctx.lineWidth = this.options.lineWidth;
      this.ctx.stroke();
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
