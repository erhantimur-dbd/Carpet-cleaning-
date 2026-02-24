/* ==========================================================================
   ELEVATE CARPET CARE — Application JavaScript
   Estimate Calculator, Booking System, Stripe Integration, Navigation
   ========================================================================== */

(function() {
    'use strict';

    // ---- Configuration ----
    // Replace with your live Stripe publishable key in production
    const STRIPE_PUBLISHABLE_KEY = 'pk_test_REPLACE_WITH_YOUR_STRIPE_KEY';

    const PRICING = {
        room: { min: 65, max: 80 },
        hall: { min: 40, max: 55 },
        stairs: { min: 45, max: 60 },
        sofa: { min: 90, max: 120 },
        armchair: { min: 45, max: 60 },
        rug: { min: 50, max: 80 },
        petTreatment: { min: 30, max: 30 },
        stainProtection: { min: 25, max: 25 },
        mattress: { min: 50, max: 50 },
        priority: { min: 40, max: 40 },
        tenancy: {
            studio: { min: 250, max: 300 },
            '2bed': { min: 300, max: 380 },
            '3bed': { min: 350, max: 450 },
            '4bed': { min: 450, max: 600 }
        },
        minimumCallout: 120,
        deposit: { min: 20, max: 40 }
    };

    // ---- DOM Ready ----
    document.addEventListener('DOMContentLoaded', function() {
        initNavigation();
        initCounters();
        initEstimateCalculator();
        initBookingForm();
        initThankYouPage();
        initQuoteForm();
        initPartnerForm();
        initScrollEffects();
        initDatePicker();
    });

    // ---- Navigation ----
    function initNavigation() {
        const toggle = document.getElementById('navToggle');
        const links = document.getElementById('navLinks');
        if (!toggle || !links) return;

        toggle.addEventListener('click', function() {
            links.classList.toggle('open');
            toggle.classList.toggle('active');
        });

        // Close on link click
        links.querySelectorAll('a').forEach(function(link) {
            link.addEventListener('click', function() {
                links.classList.remove('open');
                toggle.classList.remove('active');
            });
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!toggle.contains(e.target) && !links.contains(e.target)) {
                links.classList.remove('open');
                toggle.classList.remove('active');
            }
        });
    }

    // ---- Scroll Effects ----
    function initScrollEffects() {
        var nav = document.getElementById('nav');
        if (!nav) return;

        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }

    // ---- Counter Buttons ----
    function initCounters() {
        document.querySelectorAll('.counter-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var target = document.getElementById(this.dataset.target);
                if (!target) return;
                var val = parseInt(target.value) || 0;
                var min = parseInt(target.min) || 0;
                var max = parseInt(target.max) || 99;

                if (this.dataset.action === 'increase' && val < max) {
                    target.value = val + 1;
                } else if (this.dataset.action === 'decrease' && val > min) {
                    target.value = val - 1;
                }

                target.dispatchEvent(new Event('change'));
            });
        });
    }

    // ---- Estimate Calculator (Homepage) ----
    function initEstimateCalculator() {
        var form = document.getElementById('estimateForm');
        if (!form) return;

        var inputs = form.querySelectorAll('input');
        inputs.forEach(function(input) {
            input.addEventListener('change', updateEstimate);
        });

        updateEstimate();

        function updateEstimate() {
            var rooms = parseInt(document.getElementById('rooms').value) || 0;
            var stairs = parseInt(document.getElementById('stairs').value) || 0;
            var sofas = parseInt(document.getElementById('sofas').value) || 0;
            var pet = document.getElementById('petTreatment').checked;
            var protection = document.getElementById('stainProtection').checked;
            var matt = document.getElementById('mattress').checked;

            var minTotal = 0;
            var maxTotal = 0;

            minTotal += rooms * PRICING.room.min;
            maxTotal += rooms * PRICING.room.max;
            minTotal += stairs * PRICING.stairs.min;
            maxTotal += stairs * PRICING.stairs.max;
            minTotal += sofas * PRICING.sofa.min;
            maxTotal += sofas * PRICING.sofa.max;

            if (pet) {
                minTotal += rooms * PRICING.petTreatment.min;
                maxTotal += rooms * PRICING.petTreatment.max;
            }
            if (protection) {
                minTotal += rooms * PRICING.stainProtection.min;
                maxTotal += rooms * PRICING.stainProtection.max;
            }
            if (matt) {
                minTotal += PRICING.mattress.min;
                maxTotal += PRICING.mattress.max;
            }

            // Apply minimum callout
            if (minTotal > 0 && minTotal < PRICING.minimumCallout) {
                minTotal = PRICING.minimumCallout;
            }
            if (maxTotal > 0 && maxTotal < PRICING.minimumCallout) {
                maxTotal = PRICING.minimumCallout;
            }

            var display = document.getElementById('resultPrice');
            if (display) {
                if (minTotal === 0) {
                    display.textContent = 'Select services above';
                } else if (minTotal === maxTotal) {
                    display.textContent = formatCurrency(minTotal);
                } else {
                    display.textContent = formatCurrency(minTotal) + ' \u2013 ' + formatCurrency(maxTotal);
                }
            }

            // Update book link with params
            var bookLink = document.getElementById('bookFromEstimate');
            if (bookLink) {
                var params = new URLSearchParams();
                params.set('rooms', rooms);
                params.set('stairs', stairs);
                params.set('sofas', sofas);
                if (pet) params.set('pet', '1');
                if (protection) params.set('protection', '1');
                if (matt) params.set('mattress', '1');
                bookLink.href = 'booking.html?' + params.toString();
            }
        }
    }

    // ---- Booking Form ----
    function initBookingForm() {
        var form = document.getElementById('bookingForm');
        if (!form) return;

        var currentStep = 1;
        var totalSteps = 4;

        // Pre-fill from URL params (from estimate calculator)
        prefillFromParams();

        // Service type switching
        var serviceRadios = form.querySelectorAll('input[name="service"]');
        serviceRadios.forEach(function(radio) {
            radio.addEventListener('change', function() {
                toggleServiceConfig(this.value);
                updateBookingEstimate();
            });
        });

        // Counter and checkbox changes update estimate
        form.querySelectorAll('input').forEach(function(input) {
            input.addEventListener('change', updateBookingEstimate);
        });

        // Property size changes
        form.querySelectorAll('input[name="propertySize"]').forEach(function(radio) {
            radio.addEventListener('change', updateBookingEstimate);
        });

        // Step navigation
        var toStep2 = document.getElementById('toStep2');
        var toStep3 = document.getElementById('toStep3');
        var toStep4 = document.getElementById('toStep4');
        var backToStep1 = document.getElementById('backToStep1');
        var backToStep2 = document.getElementById('backToStep2');
        var backToStep3 = document.getElementById('backToStep3');

        if (toStep2) toStep2.addEventListener('click', function() { goToStep(2); });
        if (toStep3) toStep3.addEventListener('click', function() {
            if (validateStep2()) goToStep(3);
        });
        if (toStep4) toStep4.addEventListener('click', function() {
            if (validateStep3()) {
                populateSummary();
                goToStep(4);
                initStripeElements();
            }
        });
        if (backToStep1) backToStep1.addEventListener('click', function() { goToStep(1); });
        if (backToStep2) backToStep2.addEventListener('click', function() { goToStep(2); });
        if (backToStep3) backToStep3.addEventListener('click', function() { goToStep(3); });

        // Form submit
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleBookingSubmit();
        });

        // Initial estimate
        updateBookingEstimate();

        function prefillFromParams() {
            var params = new URLSearchParams(window.location.search);
            var roomsInput = document.getElementById('bookRooms');
            var stairsInput = document.getElementById('bookStairs');

            if (params.get('rooms') && roomsInput) roomsInput.value = params.get('rooms');
            if (params.get('stairs') && stairsInput) stairsInput.value = params.get('stairs');
            if (params.get('sofas')) {
                // Switch to upholstery if sofas were selected
                var sofaCount = parseInt(params.get('sofas'));
                if (sofaCount > 0) {
                    var sofaInput = document.getElementById('bookSofas');
                    if (sofaInput) sofaInput.value = sofaCount;
                }
            }
            if (params.get('pet')) {
                var petCheck = document.getElementById('addonPet');
                if (petCheck) petCheck.checked = true;
            }
            if (params.get('protection')) {
                var protCheck = document.getElementById('addonProtection');
                if (protCheck) protCheck.checked = true;
            }
            if (params.get('mattress')) {
                var matCheck = document.getElementById('addonMattress');
                if (matCheck) matCheck.checked = true;
            }
        }

        function toggleServiceConfig(service) {
            var configs = {
                carpet: document.getElementById('carpetConfig'),
                tenancy: document.getElementById('tenancyConfig'),
                upholstery: document.getElementById('upholsteryConfig')
            };

            Object.keys(configs).forEach(function(key) {
                if (configs[key]) {
                    configs[key].classList.toggle('hidden', key !== service);
                }
            });
        }

        function goToStep(step) {
            currentStep = step;
            for (var i = 1; i <= totalSteps; i++) {
                var stepEl = document.getElementById('step' + i);
                var progressEl = document.querySelector('.progress-step[data-step="' + i + '"]');
                if (stepEl) stepEl.classList.toggle('active', i === step);
                if (progressEl) {
                    progressEl.classList.toggle('active', i === step);
                    progressEl.classList.toggle('completed', i < step);
                }
            }
            window.scrollTo({ top: 200, behavior: 'smooth' });
        }

        function validateStep2() {
            var required = ['firstName', 'lastName', 'email', 'phone', 'address', 'postcode'];
            var valid = true;
            required.forEach(function(id) {
                var input = document.getElementById(id);
                if (input && !input.value.trim()) {
                    input.style.borderColor = '#c43d3d';
                    valid = false;
                } else if (input) {
                    input.style.borderColor = '';
                }
            });
            if (!valid) showToast('Please fill in all required fields.', 'error');
            return valid;
        }

        function validateStep3() {
            var dateInput = document.getElementById('bookingDate');
            if (!dateInput || !dateInput.value) {
                showToast('Please select a date.', 'error');
                return false;
            }
            return true;
        }
    }

    // ---- Update Booking Estimate ----
    function updateBookingEstimate() {
        var form = document.getElementById('bookingForm');
        if (!form) return;

        var service = form.querySelector('input[name="service"]:checked');
        if (!service) return;

        var result = calculateBookingPrice(service.value);
        var display = document.getElementById('bookingEstimate');

        if (display) {
            if (result.min === result.max) {
                display.textContent = formatCurrency(result.min);
            } else {
                display.textContent = formatCurrency(result.min) + ' \u2013 ' + formatCurrency(result.max);
            }
        }
    }

    function calculateBookingPrice(serviceType) {
        var minTotal = 0;
        var maxTotal = 0;

        if (serviceType === 'carpet') {
            var rooms = parseInt(document.getElementById('bookRooms').value) || 0;
            var halls = parseInt(document.getElementById('bookHalls').value) || 0;
            var stairs = parseInt(document.getElementById('bookStairs').value) || 0;

            minTotal += rooms * PRICING.room.min;
            maxTotal += rooms * PRICING.room.max;
            minTotal += halls * PRICING.hall.min;
            maxTotal += halls * PRICING.hall.max;
            minTotal += stairs * PRICING.stairs.min;
            maxTotal += stairs * PRICING.stairs.max;

        } else if (serviceType === 'tenancy') {
            var size = document.querySelector('input[name="propertySize"]:checked');
            if (size) {
                var tier = PRICING.tenancy[size.value];
                if (tier) {
                    minTotal += tier.min;
                    maxTotal += tier.max;
                }
            }
        } else if (serviceType === 'upholstery') {
            var sofas = parseInt(document.getElementById('bookSofas').value) || 0;
            var chairs = parseInt(document.getElementById('bookChairs').value) || 0;
            var rugs = parseInt(document.getElementById('bookRugs').value) || 0;

            minTotal += sofas * PRICING.sofa.min;
            maxTotal += sofas * PRICING.sofa.max;
            minTotal += chairs * PRICING.armchair.min;
            maxTotal += chairs * PRICING.armchair.max;
            minTotal += rugs * PRICING.rug.min;
            maxTotal += rugs * PRICING.rug.max;
        }

        // Add-ons
        var roomCount = 1;
        if (serviceType === 'carpet') {
            roomCount = parseInt(document.getElementById('bookRooms').value) || 1;
        }

        if (document.getElementById('addonPet') && document.getElementById('addonPet').checked) {
            minTotal += roomCount * PRICING.petTreatment.min;
            maxTotal += roomCount * PRICING.petTreatment.max;
        }
        if (document.getElementById('addonProtection') && document.getElementById('addonProtection').checked) {
            minTotal += roomCount * PRICING.stainProtection.min;
            maxTotal += roomCount * PRICING.stainProtection.max;
        }
        if (document.getElementById('addonMattress') && document.getElementById('addonMattress').checked) {
            minTotal += PRICING.mattress.min;
            maxTotal += PRICING.mattress.max;
        }
        if (document.getElementById('addonPriority') && document.getElementById('addonPriority').checked) {
            minTotal += PRICING.priority.min;
            maxTotal += PRICING.priority.max;
        }

        // Apply minimum callout
        if (minTotal > 0 && minTotal < PRICING.minimumCallout) minTotal = PRICING.minimumCallout;
        if (maxTotal > 0 && maxTotal < PRICING.minimumCallout) maxTotal = PRICING.minimumCallout;

        return { min: minTotal, max: maxTotal };
    }

    // ---- Populate Booking Summary ----
    function populateSummary() {
        var form = document.getElementById('bookingForm');
        var summaryRows = document.getElementById('summaryRows');
        var summaryTotal = document.getElementById('summaryTotal');
        var summaryDeposit = document.getElementById('summaryDeposit');
        if (!form || !summaryRows) return;

        var service = form.querySelector('input[name="service"]:checked');
        var serviceNames = {
            carpet: 'Deep Carpet Cleaning',
            tenancy: 'End of Tenancy Premium',
            upholstery: 'Upholstery & Rug Care'
        };

        var rows = '';
        rows += summaryRowHTML('Service', serviceNames[service.value]);

        if (service.value === 'carpet') {
            var rooms = document.getElementById('bookRooms').value;
            var halls = document.getElementById('bookHalls').value;
            var stairs = document.getElementById('bookStairs').value;
            rows += summaryRowHTML('Rooms', rooms);
            if (parseInt(halls) > 0) rows += summaryRowHTML('Hallways / landings', halls);
            if (parseInt(stairs) > 0) rows += summaryRowHTML('Flights of stairs', stairs);
        } else if (service.value === 'tenancy') {
            var sizeEl = document.querySelector('input[name="propertySize"]:checked');
            var sizeLabels = { studio: 'Studio / 1-bed', '2bed': '2-bed flat', '3bed': '3-bed house', '4bed': '4+ bed' };
            rows += summaryRowHTML('Property', sizeLabels[sizeEl.value]);
        } else if (service.value === 'upholstery') {
            var sofas = document.getElementById('bookSofas').value;
            var chairs = document.getElementById('bookChairs').value;
            var rugs = document.getElementById('bookRugs').value;
            if (parseInt(sofas) > 0) rows += summaryRowHTML('Sofas', sofas);
            if (parseInt(chairs) > 0) rows += summaryRowHTML('Armchairs', chairs);
            if (parseInt(rugs) > 0) rows += summaryRowHTML('Rugs', rugs);
        }

        // Add-ons
        if (document.getElementById('addonPet').checked) rows += summaryRowHTML('Pet treatment', 'Yes');
        if (document.getElementById('addonProtection').checked) rows += summaryRowHTML('Stain protection', 'Yes');
        if (document.getElementById('addonMattress').checked) rows += summaryRowHTML('Mattress sanitisation', 'Yes');
        if (document.getElementById('addonPriority').checked) rows += summaryRowHTML('Same-day priority', '+\u00A340');

        // Date & time
        var dateInput = document.getElementById('bookingDate');
        var timeInput = document.querySelector('input[name="timeSlot"]:checked');
        var timeLabels = { morning: 'Morning (8:00 \u2013 12:00)', afternoon: 'Afternoon (12:00 \u2013 16:00)', evening: 'Evening (16:00 \u2013 19:00)' };

        if (dateInput && dateInput.value) {
            rows += summaryRowHTML('Date', formatDate(dateInput.value));
        }
        if (timeInput) {
            rows += summaryRowHTML('Time slot', timeLabels[timeInput.value]);
        }

        // Contact
        var name = (document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value).trim();
        var address = document.getElementById('address').value;
        var postcode = document.getElementById('postcode').value;
        rows += summaryRowHTML('Name', name);
        rows += summaryRowHTML('Address', address + ', ' + postcode);

        summaryRows.innerHTML = rows;

        // Totals
        var price = calculateBookingPrice(service.value);
        if (summaryTotal) {
            summaryTotal.textContent = price.min === price.max
                ? formatCurrency(price.min)
                : formatCurrency(price.min) + ' \u2013 ' + formatCurrency(price.max);
        }

        // Deposit calculation (proportional: roughly 10-15% of estimated total, min £20, max £40)
        var depositAmount = Math.min(40, Math.max(20, Math.round(price.min * 0.12)));
        if (summaryDeposit) {
            summaryDeposit.textContent = formatCurrency(depositAmount);
        }
    }

    function summaryRowHTML(label, value) {
        return '<div class="summary-row"><span>' + escapeHtml(label) + '</span><span class="detail-value">' + escapeHtml(value) + '</span></div>';
    }

    // ---- Stripe Integration ----
    var stripe = null;
    var stripeElements = null;
    var cardElement = null;

    function initStripeElements() {
        // Check if Stripe.js is loaded
        if (typeof Stripe === 'undefined') {
            // Load Stripe.js dynamically
            var script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = function() {
                setupStripe();
            };
            document.head.appendChild(script);
        } else {
            setupStripe();
        }
    }

    function setupStripe() {
        if (stripe) return; // Already initialized

        stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        stripeElements = stripe.elements({
            fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap' }]
        });

        // Replace the manual card fields with Stripe Elements
        var paymentSection = document.querySelector('.payment-section .form-grid');
        if (paymentSection) {
            paymentSection.innerHTML =
                '<div class="form-group form-group-full">' +
                    '<label>Card details *</label>' +
                    '<div id="stripe-card-element"></div>' +
                    '<div id="stripe-errors" class="stripe-error"></div>' +
                '</div>';

            cardElement = stripeElements.create('card', {
                style: {
                    base: {
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '16px',
                        color: '#2a2826',
                        '::placeholder': { color: '#8a8680' }
                    },
                    invalid: {
                        color: '#c43d3d'
                    }
                }
            });

            cardElement.mount('#stripe-card-element');

            cardElement.on('change', function(event) {
                var errorEl = document.getElementById('stripe-errors');
                if (errorEl) {
                    errorEl.textContent = event.error ? event.error.message : '';
                }
            });
        }
    }

    function handleBookingSubmit() {
        var termsCheck = document.getElementById('termsAgree');
        if (termsCheck && !termsCheck.checked) {
            showToast('Please agree to the Terms of Service.', 'error');
            return;
        }

        var submitBtn = document.getElementById('submitBooking');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing...';
        }

        // In production, this would create a PaymentIntent on your server
        // and confirm the payment with Stripe. For demo purposes:
        if (stripe && cardElement) {
            // Production flow:
            // 1. POST to your server to create a Stripe PaymentIntent
            // 2. Use stripe.confirmCardPayment() with the client secret
            // 3. On success, redirect to thank-you page

            // Demo: simulate Stripe payment
            stripe.createToken(cardElement).then(function(result) {
                if (result.error) {
                    showToast(result.error.message, 'error');
                    if (submitBtn) {
                        submitBtn.classList.remove('loading');
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Pay Deposit & Confirm Booking';
                    }
                } else {
                    // Token created successfully — send to your server
                    processBooking(result.token);
                }
            });
        } else {
            // Fallback: no Stripe loaded (demo mode)
            setTimeout(function() {
                processBooking(null);
            }, 1500);
        }
    }

    function processBooking(stripeToken) {
        // In production, POST the booking data + stripeToken to your backend
        var form = document.getElementById('bookingForm');
        var service = form.querySelector('input[name="service"]:checked');

        var bookingData = {
            service: service ? service.value : '',
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            postcode: document.getElementById('postcode').value,
            date: document.getElementById('bookingDate').value,
            timeSlot: (form.querySelector('input[name="timeSlot"]:checked') || {}).value,
            stripeToken: stripeToken ? stripeToken.id : null,
            addons: {
                pet: document.getElementById('addonPet').checked,
                protection: document.getElementById('addonProtection').checked,
                mattress: document.getElementById('addonMattress').checked,
                priority: document.getElementById('addonPriority').checked
            }
        };

        // Store in session for thank-you page
        try {
            sessionStorage.setItem('lastBooking', JSON.stringify(bookingData));
        } catch (e) {
            // Session storage unavailable
        }

        // Generate booking reference
        var ref = 'ECC-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random() * 900 + 100);
        try {
            sessionStorage.setItem('bookingRef', ref);
        } catch (e) {}

        // Redirect to thank-you page
        window.location.href = 'thank-you.html';
    }

    // ---- Thank You Page ----
    function initThankYouPage() {
        if (!document.querySelector('.thank-you-section')) return;

        // Populate from session storage
        try {
            var booking = JSON.parse(sessionStorage.getItem('lastBooking'));
            var ref = sessionStorage.getItem('bookingRef');

            if (booking) {
                var serviceNames = {
                    carpet: 'Deep Carpet Cleaning',
                    tenancy: 'End of Tenancy Premium',
                    upholstery: 'Upholstery & Rug Care'
                };
                var timeLabels = {
                    morning: 'Morning (8:00 \u2013 12:00)',
                    afternoon: 'Afternoon (12:00 \u2013 16:00)',
                    evening: 'Evening (16:00 \u2013 19:00)'
                };

                setTextContent('bookingRef', ref || 'ECC-' + Date.now());
                setTextContent('bookingService', serviceNames[booking.service] || booking.service);
                setTextContent('bookingDate', booking.date ? formatDate(booking.date) : '\u2014');
                setTextContent('bookingTime', timeLabels[booking.timeSlot] || booking.timeSlot);
            }
        } catch (e) {
            // No session data
        }

        // Upsell buttons
        document.querySelectorAll('.upsell-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                this.textContent = 'Added';
                this.classList.add('added');
                showToast('Added to your booking. We\'ll include this on the day.', 'success');
            });
        });

        // Subscription button
        var subscribeBtn = document.getElementById('subscribeBtn');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                initSubscriptionCheckout();
            });
        }

        // Copy referral link
        var copyBtn = document.getElementById('copyReferral');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var linkInput = document.getElementById('referralLink');
                if (linkInput) {
                    linkInput.select();
                    try {
                        navigator.clipboard.writeText(linkInput.value);
                        showToast('Referral link copied.', 'success');
                    } catch (e) {
                        document.execCommand('copy');
                        showToast('Referral link copied.', 'success');
                    }
                }
            });
        }
    }

    // ---- Stripe Subscription (Quarterly Plan) ----
    function initSubscriptionCheckout() {
        // In production, create a Stripe Checkout Session on your server
        // for a recurring subscription with:
        //   - 15% discount applied
        //   - Quarterly billing cycle (every 3 months)
        //   - 12-month minimum commitment (4 billing cycles)
        //   - Cancel after 12 months with notice

        // Demo: show modal/overlay with subscription details
        var overlay = document.createElement('div');
        overlay.className = 'subscription-modal-overlay';
        overlay.innerHTML =
            '<div class="subscription-modal">' +
                '<button class="modal-close" id="closeSubModal">&times;</button>' +
                '<h2>Quarterly Cleaning Plan</h2>' +
                '<p class="modal-subtitle">Save 15% on every clean with a regular schedule.</p>' +
                '<div class="plan-details">' +
                    '<div class="plan-feature"><strong>Billing:</strong> Every 3 months (quarterly)</div>' +
                    '<div class="plan-feature"><strong>Discount:</strong> 15% off all services</div>' +
                    '<div class="plan-feature"><strong>Commitment:</strong> 12-month minimum term</div>' +
                    '<div class="plan-feature"><strong>Cancellation:</strong> Cancel after 12 months with 30 days notice</div>' +
                    '<div class="plan-feature"><strong>Includes:</strong> Priority scheduling, automated reminders</div>' +
                '</div>' +
                '<div class="plan-pricing">' +
                    '<p>Your quarterly payment will be calculated based on your selected services with 15% discount applied automatically.</p>' +
                '</div>' +
                '<button class="btn btn-primary btn-lg btn-block" id="confirmSubscription">Continue to Payment</button>' +
                '<p class="modal-note">You\'ll be redirected to our secure Stripe payment page.</p>' +
            '</div>';

        document.body.appendChild(overlay);

        // Add modal styles dynamically
        if (!document.getElementById('modalStyles')) {
            var style = document.createElement('style');
            style.id = 'modalStyles';
            style.textContent =
                '.subscription-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(4px)}' +
                '.subscription-modal{background:#fff;border-radius:16px;padding:48px 40px;max-width:520px;width:100%;position:relative;box-shadow:0 16px 50px rgba(0,0,0,0.2)}' +
                '.modal-close{position:absolute;top:16px;right:20px;font-size:1.5rem;color:#8a8680;background:none;border:none;cursor:pointer;padding:4px;line-height:1}' +
                '.modal-close:hover{color:#2a2826}' +
                '.subscription-modal h2{font-family:"Playfair Display",serif;margin-bottom:8px}' +
                '.modal-subtitle{color:#6a6660;margin-bottom:24px}' +
                '.plan-details{margin-bottom:24px}' +
                '.plan-feature{padding:10px 0;border-bottom:1px solid #f0eee9;font-size:0.9rem;color:#4a4640}' +
                '.plan-feature:last-child{border-bottom:none}' +
                '.plan-feature strong{color:#2a2826}' +
                '.plan-pricing{padding:20px;background:#f8f7f4;border-radius:8px;margin-bottom:24px;font-size:0.9rem;color:#6a6660}' +
                '.modal-note{font-size:0.8rem;color:#8a8680;text-align:center;margin-top:12px}';
            document.head.appendChild(style);
        }

        setTimeout(function() {
            overlay.style.opacity = '1';
        }, 10);

        document.getElementById('closeSubModal').addEventListener('click', function() {
            overlay.remove();
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });

        document.getElementById('confirmSubscription').addEventListener('click', function() {
            this.classList.add('loading');
            this.textContent = 'Redirecting to Stripe...';

            // In production: POST to server to create Stripe Checkout Session
            // for subscription with price_id and redirect to session.url
            //
            // Server-side example (Node.js):
            // const session = await stripe.checkout.sessions.create({
            //     mode: 'subscription',
            //     line_items: [{ price: 'price_quarterly_plan_id', quantity: 1 }],
            //     subscription_data: {
            //         metadata: { min_commitment_months: '12' }
            //     },
            //     discounts: [{ coupon: 'QUARTERLY15' }],
            //     success_url: 'https://elevatecarpetcare.co.uk/thank-you.html?sub=active',
            //     cancel_url: 'https://elevatecarpetcare.co.uk/thank-you.html',
            // });

            setTimeout(function() {
                showToast('Subscription setup! In production this redirects to Stripe Checkout.', 'success');
                overlay.remove();
            }, 2000);
        });
    }

    // ---- Quote Form ----
    function initQuoteForm() {
        var form = document.getElementById('quoteForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var btn = form.querySelector('button[type="submit"]');
            if (btn) {
                btn.classList.add('loading');
                btn.disabled = true;
            }

            // In production: POST to your server/email service
            setTimeout(function() {
                showToast('Quote request sent. We\'ll be in touch within 24 hours.', 'success');
                form.reset();
                if (btn) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            }, 1500);
        });
    }

    // ---- Partner Form ----
    function initPartnerForm() {
        var form = document.getElementById('partnerForm');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var btn = form.querySelector('button[type="submit"]');
            if (btn) {
                btn.classList.add('loading');
                btn.disabled = true;
            }

            // In production: POST to your server/email service
            setTimeout(function() {
                showToast('Application submitted! We\'ll review it within 48 hours and be in touch.', 'success');
                form.reset();
                if (btn) {
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            }, 1500);
        });
    }

    // ---- Date Picker ----
    function initDatePicker() {
        var dateInput = document.getElementById('bookingDate');
        if (!dateInput) return;

        // Set minimum date to tomorrow
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateInput.min = tomorrow.toISOString().split('T')[0];

        // Set max date to 3 months from now
        var maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.max = maxDate.toISOString().split('T')[0];
    }

    // ---- Utilities ----
    function formatCurrency(amount) {
        return '\u00A3' + amount.toLocaleString('en-GB');
    }

    function formatDate(dateStr) {
        var date = new Date(dateStr + 'T00:00:00');
        var options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    function setTextContent(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(message, type) {
        var existing = document.querySelector('.toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'toast' + (type ? ' ' + type : '');
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() { toast.classList.add('show'); }, 10);
        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 4000);
    }

})();
