FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ /app/src/
COPY constitution/ /app/constitution/
RUN mkdir -p /app/data /app/security && \
    addgroup --system babirye && adduser --system --ingroup babirye babirye && \
    chown -R babirye:babirye /app
USER babirye
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=15s \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--limit-max-header-size", "8192", "--timeout-keep-alive", "30"]
