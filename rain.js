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
      color: 'rgba(255, 255, 255, 0.5)',
      // Number of particles. [0, MAX_VALUE).
      count: 500,
      // Gravity.
      gravity: 10,
      // Width of each particle (perpendicular to the direction of travel).
      // [0, MAX_VALUE).
      lineWidth: 0.5,
      // Length of each particle, as a function of its velocity.
      scale: 1,
      // Velocity ranges.
      velocity: {
        x: {
          min: 0,
          max: -5
        },
        y: {
          min: 10,
          max: 20
        }
      },
      // Turns on debug drawing.
      debug: false
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

  /**
   * Returns a random integer:
   *
   *  [0, value) if value  > 0
   *  (value, 0]    value  < 0
   *  0             value is 0
   */
  function randomInt( value ) {
    return Math.round( Math.random() * value );
  }

  /**
   * Limits the value to within the range [min, max].
   */
  function limit( value, min, max ) {
    return Math.min( Math.max( value, min ), max );
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

    // Limit values.
    this.options.count     = limit( this.options.count,     0, Number.MAX_VALUE );
    this.options.lineWidth = limit( this.options.lineWidth, 0, Number.MAX_VALUE );
    this.options.scale     = limit( this.options.scale,     0, Number.MAX_VALUE );

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

      var xmin = this.options.velocity.x.min,
          ymin = this.options.velocity.y.min,
          xmax = this.options.velocity.x.max,
          ymax = this.options.velocity.y.max;

      var i = 0;
      while ( i < this.options.count ) {
        this.points.positions.push(
          randomInt( width  ),
          randomInt( height )
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

      var scale = this.options.scale;

      var xmin = this.options.velocity.x.min,
          ymin = this.options.velocity.y.min,
          xmax = this.options.velocity.x.max,
          ymax = this.options.velocity.y.max;

      var dy = this.options.gravity * dt;

      var xIndex, yIndex,
          x0, y0, x1, y1;

      while ( i < pointCount ) {
        xIndex = 2 * i;
        yIndex = 2 * i + 1;

        velocities[ yIndex ] += dy;

        x0 = positions[ xIndex ] += velocities[ xIndex ];
        y0 = positions[ yIndex ] += velocities[ yIndex ];

        x1 = x0 - velocities[ xIndex ] * scale;
        y1 = y0 - velocities[ yIndex ] * scale;

        if ( 0 > x0 && 0 > x1 ) {
          velocities[ xIndex ] = randomInRange( xmin, xmax );
          positions[ xIndex ] = width;
          positions[ yIndex ] = randomInt( height );
        } else if ( x0 > width && x1 > width ) {
          velocities[ xIndex ] = randomInRange( xmin, xmax );
          positions[ xIndex ] = 0;
          positions[ yIndex ] = randomInt( height );
        }

        if ( 0 > y0 && 0 > y1 ) {
          velocities[ yIndex ] = randomInRange( ymin, ymax );
          positions[ xIndex ] = randomInt( width );
          positions[ yIndex ] = height;
        } else if ( y0 > height && y1 > height ) {
          velocities[ yIndex ] = randomInRange( ymin, ymax );
          positions[ xIndex ] = randomInt( width );
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

          this.ctx.fillRect( positions[ xIndex ], positions[ yIndex ], 4, 4 );
          i++;
        }
      }
    },

    play: function() {
      this.running = true;
    },

    pause: function() {
      this.running = false;
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
