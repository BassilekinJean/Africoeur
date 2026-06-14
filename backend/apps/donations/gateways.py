"""
Abstraction des passerelles de paiement (Mobile Money + cartes diaspora).

Chaque passerelle implémente `initiate()` (création d'une transaction et URL de
paiement) et `verify()` (vérification d'un webhook entrant). Les implémentations
réseau réelles (CinetPay / Campay / Flutterwave) sont à brancher ici ; on fournit
une base commune + un mode bac à sable pour le développement local.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass

from django.conf import settings


@dataclass
class InitiationResult:
    transaction_ref: str
    payment_url: str
    raw: dict


class BaseGateway:
    code: str = ""

    def __init__(self):
        self.config = settings.PAYMENT_GATEWAYS.get(self.code, {})
        self.sandbox = not any(self.config.values())

    def initiate(self, donation) -> InitiationResult:
        raise NotImplementedError

    def verify(self, payload: dict) -> tuple[str, bool]:
        """Renvoie (transaction_ref, est_confirmé) à partir d'un webhook."""
        raise NotImplementedError


class SandboxMixin:
    """Mode développement : pas d'appel réseau, confirmation simulée."""

    def initiate(self, donation) -> InitiationResult:  # type: ignore[override]
        ref = f"SBX-{uuid.uuid4().hex[:16]}"
        return InitiationResult(
            transaction_ref=ref,
            payment_url=f"/sandbox/pay/{ref}",
            raw={"sandbox": True, "gateway": self.code},
        )

    def verify(self, payload: dict) -> tuple[str, bool]:  # type: ignore[override]
        return payload.get("transaction_ref", ""), payload.get("status") == "confirmed"


class CinetPayGateway(SandboxMixin, BaseGateway):
    code = "cinetpay"


class CampayGateway(SandboxMixin, BaseGateway):
    code = "campay"


class FlutterwaveGateway(SandboxMixin, BaseGateway):
    code = "flutterwave"


_REGISTRY = {
    "cinetpay": CinetPayGateway,
    "campay": CampayGateway,
    "flutterwave": FlutterwaveGateway,
}


def get_gateway(code: str) -> BaseGateway:
    try:
        return _REGISTRY[code]()
    except KeyError as exc:
        raise ValueError(f"Passerelle de paiement inconnue : {code}") from exc
