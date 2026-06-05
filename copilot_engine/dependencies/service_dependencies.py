# ai/dependencies/service_dependencies.py

from copilot_engine.services.backend_client import BackendClient


def get_backend_client() -> BackendClient:

    return BackendClient()