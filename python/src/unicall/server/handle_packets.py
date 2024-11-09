import asyncio
import socket
import sys
from typing import Callable
from unicall import classes
from unicall import coding
from unicall.server import interface
from unicall.server import writeback

# TODO: update this to the ReturnData type
pending_returns = list[any]
functions = list[Callable]

async def handle_packet(
    socket: socket.socket,
    return_id: int,
    function_id: int,
    *args: list[1]
):
    """Handles a single packet request

    Args:
        socket: The socket to return to.
        return_id: The id to return to.
        function_id: The function to run.
    """
    _metadata, func = interface.interface[function_id]
    return_value = await func(*args)
    socket.send(classes.ReturnData(
        value=return_value,
        destination=return_id,
    ))
    
def serve():
    """Serves the RPC server on the socket in sys.argv[1].
    """
    socket_to_client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    socket_to_client.connect(sys.argv[1])
    writeback.write_back(socket_to_client=socket_to_client)

    async def inner():
        while True:
            data = bytes()
            data += await socket_to_client.recv(5)
            remaining_length = int.from_bytes(data[1:5], 'big')
            data += await socket_to_client.recv(remaining_length)
            
            function_id, return_id, arguments = coding.decode_function_request(data)
            handle_packet(
                socket=socket_to_client,
                return_id=return_id,
                function_id=function_id,
                *arguments,
            )
    asyncio.run(inner)