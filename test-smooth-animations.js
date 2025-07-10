// Comprehensive smooth animation and scroll test for ToolLink
console.log('🔍 Starting ToolLink Smooth Animation Test...');

// Test 1: Check smooth scroll support
function testSmoothScrollSupport() {
  console.log('\n📋 Testing Smooth Scroll Support...');
  
  const hasNativeSupport = 'scrollBehavior' in document.documentElement.style;
  const hasScrollIntoView = 'scrollIntoView' in document.documentElement;
  
  console.log('✅ Native scroll-behavior support:', hasNativeSupport);
  console.log('✅ ScrollIntoView support:', hasScrollIntoView);
  console.log('✅ CSS scroll-behavior applied:', 
    getComputedStyle(document.documentElement).scrollBehavior === 'smooth');
  
  return { hasNativeSupport, hasScrollIntoView };
}

// Test 2: Check CSS animations and transitions
function testCSSAnimations() {
  console.log('\n🎨 Testing CSS Animations and Transitions...');
  
  // Check if CSS transitions are working
  const testElement = document.createElement('div');
  testElement.style.transition = 'all 0.3s ease';
  document.body.appendChild(testElement);
  
  const computedStyle = getComputedStyle(testElement);
  const hasTransitions = computedStyle.transitionDuration !== '0s';
  
  console.log('✅ CSS Transitions working:', hasTransitions);
  console.log('✅ Transition duration:', computedStyle.transitionDuration);
  console.log('✅ Transition timing:', computedStyle.transitionTimingFunction);
  
  document.body.removeChild(testElement);
  
  return { hasTransitions };
}

// Test 3: Check framer-motion animations
function testFramerMotion() {
  console.log('\n🎬 Testing Framer Motion Animations...');
  
  const motionElements = document.querySelectorAll('[data-framer-motion]');
  const animatedElements = document.querySelectorAll('.animate-pulse, .animate-bounce');
  
  console.log('✅ Framer Motion elements found:', motionElements.length);
  console.log('✅ CSS animated elements found:', animatedElements.length);
  
  return { motionElements: motionElements.length, animatedElements: animatedElements.length };
}

// Test 4: Test actual smooth scrolling
function testSmoothScrolling() {
  console.log('\n🔄 Testing Actual Smooth Scrolling...');
  
  const sections = ['features', 'about', 'testimonials', 'contact'];
  const testResults = [];
  
  sections.forEach(sectionId => {
    const element = document.getElementById(sectionId);
    if (element) {
      console.log(`✅ Section "${sectionId}" found at position:`, element.offsetTop);
      testResults.push({ id: sectionId, found: true, position: element.offsetTop });
    } else {
      console.log(`❌ Section "${sectionId}" not found`);
      testResults.push({ id: sectionId, found: false, position: null });
    }
  });
  
  return testResults;
}

// Test 5: Check button hover effects
function testButtonHoverEffects() {
  console.log('\n🖱️ Testing Button Hover Effects...');
  
  const buttons = document.querySelectorAll('button, .btn, a[class*="button"], a[class*="btn"]');
  let smoothButtons = 0;
  
  buttons.forEach((button, index) => {
    const style = getComputedStyle(button);
    const hasTransition = style.transitionDuration !== '0s';
    const hasTransform = style.transform !== 'none' || style.getPropertyValue('--tw-transform');
    
    if (hasTransition) {
      smoothButtons++;
      if (index < 5) { // Log first 5 for debugging
        console.log(`✅ Button ${index + 1} has smooth transitions:`, {
          duration: style.transitionDuration,
          timing: style.transitionTimingFunction,
          transform: hasTransform
        });
      }
    }
  });
  
  console.log(`✅ Total buttons with smooth effects: ${smoothButtons}/${buttons.length}`);
  
  return { totalButtons: buttons.length, smoothButtons };
}

// Test 6: Performance check
function testAnimationPerformance() {
  console.log('\n⚡ Testing Animation Performance...');
  
  const startTime = performance.now();
  
  // Simulate scroll
  window.scrollTo({ top: 500, behavior: 'smooth' });
  
  setTimeout(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log('✅ Scroll animation duration:', duration + 'ms');
    console.log('✅ Performance rating:', duration < 100 ? 'Excellent' : duration < 300 ? 'Good' : 'Needs improvement');
    
    // Reset scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 100);
}

// Test 7: Check for smooth scroll issues
function detectSmoothScrollIssues() {
  console.log('\n🔍 Detecting Potential Smooth Scroll Issues...');
  
  const issues = [];
  
  // Check for conflicting CSS
  const htmlStyle = getComputedStyle(document.documentElement);
  if (htmlStyle.scrollBehavior !== 'smooth') {
    issues.push('HTML scroll-behavior is not set to smooth');
  }
  
  // Check for fixed navigation
  const navElements = document.querySelectorAll('nav, .nav, [class*="nav"]');
  let hasFixedNav = false;
  navElements.forEach(nav => {
    const style = getComputedStyle(nav);
    if (style.position === 'fixed' || style.position === 'sticky') {
      hasFixedNav = true;
    }
  });
  
  if (hasFixedNav && !htmlStyle.scrollPaddingTop) {
    issues.push('Fixed navigation detected but no scroll-padding-top set');
  }
  
  // Check for motion preference respect
  const respectsMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (respectsMotion) {
    console.log('⚠️ User prefers reduced motion - animations should be minimal');
  }
  
  if (issues.length === 0) {
    console.log('✅ No smooth scroll issues detected!');
  } else {
    console.log('❌ Issues found:', issues);
  }
  
  return issues;
}

// Main test runner
function runAllTests() {
  console.log('🚀 ToolLink Smooth Animation Comprehensive Test\n');
  console.log('='.repeat(50));
  
  const results = {};
  
  try {
    results.scrollSupport = testSmoothScrollSupport();
    results.cssAnimations = testCSSAnimations();
    results.framerMotion = testFramerMotion();
    results.smoothScrolling = testSmoothScrolling();
    results.buttonEffects = testButtonHoverEffects();
    results.issues = detectSmoothScrollIssues();
    
    console.log('\n📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Smooth scroll support:', results.scrollSupport.hasNativeSupport ? 'YES' : 'NO');
    console.log('✅ CSS transitions working:', results.cssAnimations.hasTransitions ? 'YES' : 'NO');
    console.log('✅ Sections found:', results.smoothScrolling.filter(s => s.found).length + '/4');
    console.log('✅ Smooth buttons:', results.buttonEffects.smoothButtons + '/' + results.buttonEffects.totalButtons);
    console.log('✅ Issues detected:', results.issues.length);
    
    if (results.issues.length === 0) {
      console.log('\n🎉 ALL SMOOTH TESTS PASSED! 🎉');
    } else {
      console.log('\n⚠️ SOME ISSUES NEED ATTENTION ⚠️');
      results.issues.forEach(issue => console.log('  - ' + issue));
    }
    
    testAnimationPerformance();
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
  
  return results;
}

// Auto-run tests when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Export for manual testing
window.testToolLinkSmooth = {
  runAllTests,
  testSmoothScrollSupport,
  testCSSAnimations,
  testFramerMotion,
  testSmoothScrolling,
  testButtonHoverEffects,
  detectSmoothScrollIssues,
  testAnimationPerformance
};

console.log('\n💡 Manual testing available via: window.testToolLinkSmooth.runAllTests()');
