import algopy

class AnjoliDAO(algopy.ARC4Contract):
    """
    This smart contract is the foundation of the Anjoli DAO.
    Its primary job on creation is to mint the official "Anjoli Token".
    It also handles donations.
    """

    @algopy.arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create(self) -> None:
        """
        Runs only once on creation. Mints the Anjoli Token ASA.
        """
        algopy.itxn.AssetConfig(
            asset_name="Anjoli Token",
            unit_name="ANJ",
            total=10_000_000,
            decimals=0,
            manager=self.app_address,
            reserve=self.app_address,
            fee=0,
        ).submit()

    @algopy.arc4.abimethod
    def donate(self, payment: algopy.PaymentTransaction) -> None:
        """
        Allows a user to donate ALGO and receive ANJ tokens in return.
        The user must opt-in to the Anjoli Token ASA before calling this.
        """
        assert payment.receiver == self.app_address
        tokens_to_send = payment.amount // 100_000 # Ratio: 1 ALGO = 10 ANJ

        algopy.itxn.AssetTransfer(
            xfer_asset=self.app.created_asset_id,
            asset_receiver=payment.sender,
            asset_amount=tokens_to_send,
            fee=0,
        ).submit()

    # This new method is needed by the frontend
    @algopy.arc4.abimethod(allow_actions=["NoOp"], readonly=True)
    def get_asset_id(self) -> algopy.UInt64:
        """Returns the Asset ID of the token minted by this contract."""
        return self.app.created_asset_id
