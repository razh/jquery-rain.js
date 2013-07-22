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
      //
      color: 'rgba(255, 255, 255, 0.6)',
      // Number of particles.
      count: 200,
      lineWidth: 0.5,
      scale: 1.25,
      // Climatologists may disagree.
      shear: 0,
      speed: 2000,
      spread: 0,
      wind: 0
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

  function randomInRange( min, max ) {
    return min + Math.random() * ( max - min );
  }

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

      var xmin = this.options.velocity.min.x,
          ymin = this.options.velocity.min.y,
          xmax = this.options.velocity.max.x,
          ymax = this.options.velocity.max.y;

      var i = 0;
      while ( i < this.options.count ) {
        this.points.positions.push(
          Math.floor( Math.random() * this.canvas.width  ),
          Math.floor( Math.random() * this.canvas.height )
        );

        this.points.velocities.push(
          randomInRange( xmin, xmax ),
          randomInRange( ymin, ymax )
        );

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
      var width  = this.canvas.width,
          height = this.canvas.height;

      var i = 0,
          positions  = this.points.positions,
          velocities = this.points.velocities,
          pointCount = 0.5 * positions.length;

      var dx = this.options.wind    * dt,
          dy = this.options.gravity * dt;

      var xIndex, yIndex;

      while ( i < pointCount ) {
        xIndex = 2 * i;
        yIndex = 2 * i + 1;

        positions[ xIndex ] += velocities[ xIndex ] * dt;
        positions[ yIndex ] += velocities[ yIndex ] * dt;

        if ( 0 > positions[ xIndex ] ) {
          positions[ xIndex ] = width;
        } else if ( positions[ xIndex ] > width ) {
          positions[ xIndex ] = 0;
        }

        if ( 0 > positions[ yIndex ] ) {
          positions[ yIndex ] = height;
        } else if ( positions[ yIndex ] > height ) {
          positions[ yIndex ] = 0;
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
          x0, y0, x1, y1;

      this.ctx.beginPath();
      while ( i < pointCount ) {
        xIndex = 2 * i;
        yIndex = 2 * i + 1;

        x0 = positions[ xIndex ];
        y0 = positions[ yIndex ];

        x1 = x0 - velocities[ xIndex ] * scale;
        y1 = y0 - velocities[ yIndex ] * scale;

        i++;

        if ( 0 > x0 && 0 > x1 ||
             0 > y0 && 0 > y1 ||
             x0 >  width && x1 >  width ||
             y0 > height && y1 > height ) {
          continue;
        }

        this.ctx.moveTo( x0, y0 );
        this.ctx.lineTo( x1, y1 );
      }

      this.ctx.strokeStyle = this.options.color;
      this.ctx.lineWidth = this.options.lineWidth;
      this.ctx.stroke();


      if ( this.options.debug ) {
        this.ctx.fillStyle = 'red';
        i = 0;
        while ( i < pointCount ) {
          xIndex = 2 * i;
          yIndex = 2 * i + 1;

          this.ctx.fillRect( positions[xIndex], positions[yIndex], 4, 4 );
          i++;
        }
      }
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
