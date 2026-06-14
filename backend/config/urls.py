from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)
from rest_framework.routers import DefaultRouter

from apps.accounts.views import MeView
from apps.campaigns.views import CampaignViewSet, FieldUpdateViewSet, FundUsageReportViewSet
from apps.core.views import health
from apps.disbursements.views import DisbursementRequestViewSet
from apps.donations.views import DonationViewSet, payment_webhook
from apps.organizations.views import OrganizationViewSet

router = DefaultRouter()
router.register("campaigns", CampaignViewSet, basename="campaign")
router.register("field-updates", FieldUpdateViewSet, basename="field-update")
router.register("fund-usage-reports", FundUsageReportViewSet, basename="fund-usage-report")
router.register("organizations", OrganizationViewSet, basename="organization")
router.register("donations", DonationViewSet, basename="donation")
router.register("disbursements", DisbursementRequestViewSet, basename="disbursement")

api_patterns = [
    path("health/", health, name="health"),
    path("me/", MeView.as_view(), name="me"),
    path("payments/webhook/<str:gateway>/", payment_webhook, name="payment-webhook"),
    path("", include(router.urls)),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include(api_patterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]
