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
      // Color of rain. Any valid rgb(a)/hsl/hex/etc. color code should work.
      color: 'rgba(255, 255, 255, 0.6)',
      // Number of particles. [0, MAX_VALUE).
      count: 200,
      // Width of each particle (perpendicular to the direction of travel).
      // [0, MAX_VALUE).
      lineWidth: 0.5,
      // Length of each particle, as a function of its velocity.
      scale: 1.25,
      // Variation in wind (climatologists may disagree).
      // If 0, the initial wind velocity is the same for all.
      shear: 0,
      speed: 2000,
      // Angle of spread in degrees. [0, 90]. At 90 degrees, rain will fall 45
      // degrees to the left and 45 degrees to the right.
      spread: 0,
      // Horizontal velocity.
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

  var DEG_TO_RAD = Math.PI / 180;

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

      var width  = this.canvas.width,
          height = this.canvas.height;

      var shear  = this.options.shear,
          speed  = this.options.speed,
          spread = this.options.spread,
          wind   = this.options.wind;

      var angle,
          windSpeed,
          i = 0;

      while ( i < this.options.count ) {
        this.points.positions.push(
          Math.floor( Math.random() * width  ),
          Math.floor( Math.random() * height )
        );

        if ( shear === 0 ) {
          windSpeed = wind;
        } else {
          // Subtract a random percentage, the maximum of which is determined
          // by shear.
          windSpeed = wind - ( wind * shear * Math.random() );
        }

        if ( spread === 0 ) {
          this.points.velocities.push( windSpeed, speed);
        } else {
          // Creates a cone centered around 0.
          angle = ( Math.random() - 0.5 ) * spread;
          // Rotate ninety degrees and convert to radians.
          angle = ( angle + 90 ) * DEG_TO_RAD;

          this.points.velocities.push(
            Math.cos( angle ) * speed + windSpeed,
            Math.sin( angle ) * speed
          );
        }

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
