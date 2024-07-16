import logging
from influxdb import InfluxDBClient
from prometheus_api_client import PrometheusConnect

def get_influxdb_client(datastore):
    """
    Create an InfluxDB client with the given datastore information.
    :param datastore: Datastore information
    :return: InfluxDB client object
    """
    return InfluxDBClient(
        host=datastore['host'],
        port=datastore['port'],
        username=datastore['username'],
        password=datastore['password'],
        database=datastore['database']
    )

def query_influxdb(query, datastore):
    """
    Query data from InfluxDB.
    :param query: Query string
    :param datastore: Datastore information
    :return: Query result
    """
    client = get_influxdb_client(datastore)
    try:
        result = client.query(query)
        return result
    except Exception as e:
        logging.error(f"Error querying InfluxDB: {e}")
        return None

def get_prometheus_client(datastore):
    """
    Create a Prometheus client with the given datastore information.
    :param datastore: Datastore information
    :return: Prometheus client object
    """
    return PrometheusConnect(
        url=f"http://{datastore['host']}:{datastore['port']}",
        headers={"Authorization": f"Bearer {datastore['password']}"} if datastore['password'] else None,
        disable_ssl=True
    )

def query_prometheus(query, datastore):
    """
    Query data from Prometheus.
    :param query: Query string
    :param datastore: Datastore information
    :return: Query result
    """
    client = get_prometheus_client(datastore)
    try:
        result = client.custom_query(query)
        return result
    except Exception as e:
        logging.error(f"Error querying Prometheus: {e}")
        return None
