/* ==========================================================================
   ELEVATE CARPET CARE — Portal JavaScript (Admin & Customer)
   Sidebar navigation, section switching, filters, interactions
   ========================================================================== */

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        initSidebar();
        initSectionSwitching();
        initOrderFilters();
        initFormHandlers();
        initReferralCopy();
    });

    // ---- Sidebar Toggle (Mobile) ----
    function initSidebar() {
        var toggle = document.getElementById('sidebarToggle');
        var sidebar = document.getElementById('sidebar');
        if (!toggle || !sidebar) return;

        // Create overlay
        var overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);

        toggle.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });

        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }

    // ---- Section Switching ----
    function initSectionSwitching() {
        var links = document.querySelectorAll('.sidebar-link[data-section]');
        var titleEl = document.getElementById('pageTitle');
        var sidebar = document.getElementById('sidebar');
        var overlay = document.querySelector('.sidebar-overlay');

        links.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var sectionId = this.dataset.section;

                // Update active link
                links.forEach(function(l) { l.classList.remove('active'); });
                this.classList.add('active');

                // Show section
                var sections = document.querySelectorAll('.portal-section');
                sections.forEach(function(s) { s.classList.remove('active'); });

                var target = document.getElementById('section-' + sectionId);
                if (target) target.classList.add('active');

                // Update title
                if (titleEl) {
                    var titles = {
                        'dashboard': 'Dashboard',
                        'orders': 'Orders',
                        'calendar': 'Calendar',
                        'customers': 'Customers',
                        'subscriptions': 'Subscriptions',
                        'revenue': 'Revenue',
                        'settings': 'Settings',
                        'overview': 'My Account',
                        'my-bookings': 'My Bookings',
                        'invoices': 'Invoices',
                        'subscription': 'My Plan',
                        'referrals': 'Referrals',
                        'profile': 'Profile'
                    };
                    titleEl.textContent = titles[sectionId] || sectionId;
                }

                // Close mobile sidebar
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('show');

                // Update URL hash
                window.location.hash = sectionId;
            });
        });

        // Handle hash on load
        var hash = window.location.hash.replace('#', '');
        if (hash) {
            var target = document.querySelector('.sidebar-link[data-section="' + hash + '"]');
            if (target) target.click();
        }
    }

    // ---- Order Filters ----
    function initOrderFilters() {
        var statusFilter = document.getElementById('orderStatusFilter');
        var serviceFilter = document.getElementById('orderServiceFilter');
        var searchInput = document.getElementById('orderSearch');
        var customerSearch = document.getElementById('customerSearch');

        if (statusFilter) {
            statusFilter.addEventListener('change', filterOrders);
        }
        if (serviceFilter) {
            serviceFilter.addEventListener('change', filterOrders);
        }
        if (searchInput) {
            searchInput.addEventListener('input', filterOrders);
        }
        if (customerSearch) {
            customerSearch.addEventListener('input', filterCustomers);
        }
    }

    function filterOrders() {
        var tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        var statusFilter = document.getElementById('orderStatusFilter');
        var serviceFilter = document.getElementById('orderServiceFilter');
        var searchInput = document.getElementById('orderSearch');

        var status = statusFilter ? statusFilter.value : 'all';
        var service = serviceFilter ? serviceFilter.value : 'all';
        var search = searchInput ? searchInput.value.toLowerCase() : '';

        var rows = tbody.querySelectorAll('tr');
        rows.forEach(function(row) {
            var cells = row.querySelectorAll('td');
            var rowText = row.textContent.toLowerCase();
            var show = true;

            // Status filter
            if (status !== 'all') {
                var statusBadge = row.querySelector('.status-badge');
                if (statusBadge) {
                    var badgeText = statusBadge.textContent.toLowerCase();
                    if (status === 'confirmed' && !badgeText.includes('confirmed')) show = false;
                    if (status === 'in-progress' && !badgeText.includes('in progress')) show = false;
                    if (status === 'completed' && !badgeText.includes('completed')) show = false;
                    if (status === 'cancelled' && !badgeText.includes('cancelled')) show = false;
                }
            }

            // Service filter
            if (service !== 'all' && show) {
                var serviceCell = cells[3] ? cells[3].textContent.toLowerCase() : '';
                if (service === 'carpet' && !serviceCell.includes('carpet')) show = false;
                if (service === 'tenancy' && !serviceCell.includes('tenancy')) show = false;
                if (service === 'upholstery' && !serviceCell.includes('sofa') && !serviceCell.includes('rug') && !serviceCell.includes('upholstery')) show = false;
            }

            // Search
            if (search && show) {
                if (!rowText.includes(search)) show = false;
            }

            row.style.display = show ? '' : 'none';
        });
    }

    function filterCustomers() {
        var search = document.getElementById('customerSearch');
        if (!search) return;

        var query = search.value.toLowerCase();
        var table = search.closest('.portal-section') || document.getElementById('section-customers');
        if (!table) return;

        var rows = table.querySelectorAll('.portal-table tbody tr');
        rows.forEach(function(row) {
            var text = row.textContent.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    }

    // ---- Form Handlers ----
    function initFormHandlers() {
        // Settings form
        var settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', function(e) {
                e.preventDefault();
                showToast('Settings saved successfully.', 'success');
            });
        }

        // Profile form
        var profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                showToast('Profile updated successfully.', 'success');
            });
        }

        // View buttons (demo)
        document.querySelectorAll('.btn-icon').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var action = this.textContent.trim().toLowerCase();
                if (action === 'view') {
                    showToast('Order details view — connect to your backend to display full details.', 'success');
                } else if (action === 'download pdf') {
                    showToast('Invoice PDF download — connect to your invoice generation service.', 'success');
                } else if (action === 'reschedule') {
                    showToast('Reschedule — connect to your booking system to enable date changes.', 'success');
                }
            });
        });

        // Export CSV button
        document.querySelectorAll('.btn-primary.btn-sm').forEach(function(btn) {
            if (btn.textContent.trim() === 'Export CSV') {
                btn.addEventListener('click', function() {
                    showToast('CSV export — connect to your backend to generate the file.', 'success');
                });
            }
        });
    }

    // ---- Referral Copy ----
    function initReferralCopy() {
        var copyBtn = document.getElementById('copyCustomerReferral');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var input = document.getElementById('customerReferralLink');
                if (input) {
                    input.select();
                    try {
                        navigator.clipboard.writeText(input.value);
                    } catch (e) {
                        document.execCommand('copy');
                    }
                    showToast('Referral link copied.', 'success');
                }
            });
        }
    }

    // ---- Toast ----
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
