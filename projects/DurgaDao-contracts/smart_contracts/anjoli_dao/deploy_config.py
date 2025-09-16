import logging
import algokit_utils

logger = logging.getLogger(__name__)

# define deployment behaviour based on supplied app spec
def deploy() -> None:
    # We no longer need to import "HelloArgs"
    from smart_contracts.artifacts.anjoli_dao.anjoli_dao_client import AnjoliDaoFactory

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer_ = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        AnjoliDaoFactory, default_sender=deployer_.address
    )

    # This part deploys our contract. It's correct and we keep it.
    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    # This part funds the new contract with 1 ALGO. We keep this.
    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        logger.info("Funding the new contract with 1 ALGO...")
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=algokit_utils.AlgoAmount(algo=1),
                sender=deployer_.address,
                receiver=app_client.app_address,
            )
        )

    # We have removed the part that called the "hello" function.
    # Instead, we will log a clear, useful message.
    logger.info(
        f"AnjoliDAO contract deployed successfully with App ID: {app_client.app_id}"
    )
