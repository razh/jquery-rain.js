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
      lineWidth: 0.5,
      scale: 1.25,
      wind: {
        x: -2,
        y: 0
      }
    };

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
    if ( !rainObjects.length ) {
      return;
    }

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
      if ( rainObject.running ) {
        rainObject.update( dt );
        rainObject.draw();
      }
    });

    window.requestAnimFrame( draw );
  }


  function Rain( el, options ) {
    this.el  = el;
    this.$el = $( el );

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
      this.$canvas = $( '<canvas></canvas>' ).prependTo( this.$el );
      this.canvas  = this.$canvas[0];
      this.ctx     = this.canvas.getContext( '2d' );

      this.$canvas.css( 'position', 'absolute' );

      this.resize();

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

    resize: function() {
      // Custom CSS.
      this.$canvas.css({
        top:  this.$el.offset().top,
        left: this.$el.offset().left
      });

      this.canvas.width  = this.$el.width();
      this.canvas.height = this.$el.height();
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

        if ( 0 > positions[ xIndex ] ) {
          positions[ xIndex ] = this.canvas.width;
        }

        if ( positions[ xIndex ] > this.canvas.width) {
          positions[ xIndex ] = 0;
        }

        if ( positions[ yIndex ] > this.canvas.height ) {
          velocities[ xIndex ] = 0;
          velocities[ yIndex ] = 0;

          positions[ xIndex ] = Math.floor( Math.random() * this.canvas.width );
          positions[ yIndex ] = 5 * Math.floor( -Math.random() * this.canvas.height ) - this.canvas.height;
        }

        i++;
      }
    },

    draw: function() {
      var width  = this.canvas.width,
          height = this.canvas.height;

      this.ctx.clearRect( 0, 0, width, height );

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

        i++;

        if ( 0 > x || x > width ) {
          continue;
        }

        if ( 0 > y || y > height ) {
          continue;
        }

        this.ctx.moveTo( x, y );
        this.ctx.lineTo( x + vx, y + vy );
      }

      this.ctx.strokeStyle = this.options.color;
      this.ctx.lineWidth = this.options.lineWidth;
      this.ctx.stroke();
    }
  };

  $( window ).resize(function() {
    rainObjects.forEach(function( rainObject ) {
      rainObject.resize();
    });
  });

  $.fn[ pluginName ] = function( options ) {
    return this.each(function() {
      if ( !$.data( this, 'plugin_' + pluginName ) ) {
        $.data( this, 'plugin_' + pluginName, new Rain( this, options ) );
      }
    });
  };

})( jQuery, window, document );
