var dancing;
var blinking;
var blushing;

dancing = new TimelineMax({repeat:-1, yoyo:true, paused:true})
  .fromTo(".head", 1, { rotation: 10, ease: Sine.easeInOut },  { rotation: -10, ease: Expo.easeInOut },0 )
  .fromTo(".tummy", 1, { xPercent: 8, scale: 1.03, rotation: -2, ease: Sine.easeInOut },  { xPercent: -5, rotation: 2,  ease : Sine.easeInOut },0 )
  .from(".leg1", 1, {rotation: 36, ease : Sine.easeInOut },0 )
  .to(".leg2", 1, {rotation: -13, ease: Expo.easeInOut },0 )
  .to(".arm1", 1, {rotation: -80, ease: Expo.easeInOut },0 )
  .to(".arm2", 1, {rotation: -80, ease: Expo.easeInOut },0 )
  .from(".shadow", 1, {scale: 1.1, xPercent: 10, ease: Circ.easeInOut },0 )

blinking = new TimelineMax({repeat:-1, yoyo:true, paused:false})
.to(".eye", 0.2, {scaleY : 0.2, ease : Sine.easeInOut,}, 4 )

blushing = new TimelineMax({paused:true})
  .to(".blush", 2, {scale : 3, yPercent: -20, ease : Sine.easeInOut}, 0 )
  .to(".eye", 0.2, {scaleY : 0.2, ease : Sine.easeInOut,}, 0 )
  .to(".eye", 0.2, {scaleY : 1, ease : Sine.easeInOut,}, 3 )

  

window.onload = function() {
      var video = document.getElementById('video');
      var canvas = document.getElementById('canvas');
      var context = canvas.getContext('2d');
      var tracker = new tracking.ObjectTracker('face');
      tracker.setInitialScale(1);
      tracker.setStepSize(1);
      tracker.setEdgesDensity(0.1);
      
      tracking.track('#video', tracker, { 
        camera: true 
      });
  

      
      
      tracker.on('track', function(event) { 
        
        if (event.data.length === 0) {
            dancing.play();  
            blushing.restart();
            blushing.pause();
         } else {
          dancing.pause();
          blushing.play();
         }
     })
    };